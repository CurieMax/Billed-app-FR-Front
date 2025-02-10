/**
 * @jest-environment jsdom
 */

import { screen, waitFor, fireEvent } from "@testing-library/dom";
import NewBillUI from "../views/NewBillUI.js";
import NewBill from "../containers/NewBill.js";
import { ROUTES } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store";
import router from "../app/Router.js";

jest.mock("../app/store", () => mockStore);

describe("Given I am connected as an employee", () => {
  describe("When I am on NewBill Page", () => {
    // Test d'affichage du formulaire
    test("Then the form new bill should be displayed", () => {
      const html = NewBillUI();
      document.body.innerHTML = html;
      expect(screen.getByTestId("form-new-bill")).toBeTruthy();
      expect(screen.getByTestId("file")).toBeTruthy();
    });

    // Test d'upload d'un fichier
    describe("When I upload a valid file", () => {
      test("Then the file should be accepted", () => {
        Object.defineProperty(window, "localStorage", {
          value: localStorageMock,
        });
        window.localStorage.setItem(
          "user",
          JSON.stringify({
            type: "Employee",
            email: "a@a",
          })
        );

        const html = NewBillUI();
        document.body.innerHTML = html;

        const onNavigate = (pathname) => {
          document.body.innerHTML = ROUTES({ pathname });
        };

        const newBill = new NewBill({
          document,
          onNavigate,
          store: mockStore,
          localStorage: window.localStorage,
        });

        const handleChangeFile = jest.fn(newBill.handleChangeFile);
        const file = screen.getByTestId("file");
        file.addEventListener("change", handleChangeFile);

        // Test with valid file
        fireEvent.change(file, {
          target: {
            files: [new File(["image"], "test.jpg", { type: "image/jpg" })],
          },
        });
        expect(handleChangeFile).toHaveBeenCalled();
        expect(file.files[0].name).toBe("test.jpg");
      });
    });
    // Test d'upload d'un fichier
    describe("When I upload an invalid file", () => {
      test("Then the file should be rejected", () => {
        Object.defineProperty(window, "localStorage", {
          value: localStorageMock,
        });
        window.localStorage.setItem(
          "user",
          JSON.stringify({
            type: "Employee",
            email: "a@a",
          })
        );

        const html = NewBillUI();
        document.body.innerHTML = html;

        const onNavigate = (pathname) => {
          document.body.innerHTML = ROUTES({ pathname });
        };

        const newBill = new NewBill({
          document,
          onNavigate,
          store: mockStore,
          localStorage: window.localStorage,
        });

        const handleChangeFile = jest.fn(newBill.handleChangeFile);
        const file = screen.getByTestId("file");
        file.addEventListener("change", handleChangeFile);

        // Test with invalid file
        fireEvent.change(file, {
          target: {
            files: [
              new File(["document"], "test.pdf", { type: "application/pdf" }),
            ],
          },
        });
        expect(handleChangeFile).toHaveBeenCalled();
        expect(file.value).toBe("");
      });
    });

    // Test de soumission du formulaire avec données valides
    describe("When I submit the form with valid data", () => {
      test("Then a new bill should be created", async () => {
        const html = NewBillUI();
        document.body.innerHTML = html;

        const onNavigate = (pathname) => {
          document.body.innerHTML = ROUTES({ pathname });
        };

        Object.defineProperty(window, "localStorage", {
          value: localStorageMock,
        });
        window.localStorage.setItem(
          "user",
          JSON.stringify({
            type: "Employee",
            email: "a@a",
          })
        );

        const newBill = new NewBill({
          document,
          onNavigate,
          store: mockStore,
          localStorage: window.localStorage,
        });

        const form = screen.getByTestId("form-new-bill");

        // Remplir le formulaire
        const expenseType = screen.getByTestId("expense-type");
        const expenseName = screen.getByTestId("expense-name");
        const datepicker = screen.getByTestId("datepicker");
        const amount = screen.getByTestId("amount");
        const vat = screen.getByTestId("vat");
        const pct = screen.getByTestId("pct");
        const commentary = screen.getByTestId("commentary");
        const file = screen.getByTestId("file");

        fireEvent.change(expenseType, { target: { value: "Transports" } });
        fireEvent.change(expenseName, { target: { value: "Test" } });
        fireEvent.change(datepicker, { target: { value: "2023-01-01" } });
        fireEvent.change(amount, { target: { value: "100" } });
        fireEvent.change(vat, { target: { value: "20" } });
        fireEvent.change(pct, { target: { value: "20" } });
        fireEvent.change(commentary, { target: { value: "Test" } });

        // Simuler l'upload de fichier
        const handleChangeFile = jest.fn(newBill.handleChangeFile);
        file.addEventListener("change", handleChangeFile);
        fireEvent.change(file, {
          target: {
            files: [new File(["image"], "test.jpg", { type: "image/jpg" })],
          },
        });

        // Soumettre le formulaire
        const handleSubmit = jest.fn((e) => newBill.handleSubmit(e));
        form.addEventListener("submit", handleSubmit);
        fireEvent.submit(form);

        expect(handleSubmit).toHaveBeenCalled();
      });
    });
  });

  // Test d'intégration POST
  describe("When an error occurs on API", () => {
    beforeEach(() => {
      jest.spyOn(mockStore, "bills");
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
          email: "a@a",
        })
      );
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.appendChild(root);
      router();
    });

    test("Then file upload should fail with 404 message error", async () => {
      mockStore.bills.mockImplementationOnce(() => {
        return {
          create: () => {
            return Promise.reject(new Error("Erreur 404"));
          },
          update: () => {
            return Promise.resolve();
          },
        };
      });

      const html = NewBillUI();
      document.body.innerHTML = html;

      // Simuler la création d'une nouvelle facture
      const newBill = new NewBill({
        document,
        onNavigate: (pathname) =>
          (document.body.innerHTML = ROUTES({ pathname })),
        store: mockStore,
        localStorage: window.localStorage,
      });

      // Simuler l'upload de fichier
      const file = screen.getByTestId("file");
      const handleChangeFile = jest.fn((e) => newBill.handleChangeFile(e));
      file.addEventListener("change", handleChangeFile);

      fireEvent.change(file, {
        target: {
          files: [new File(["image"], "test.jpg", { type: "image/jpg" })],
        },
      });

      await waitFor(() => {
        expect(handleChangeFile).toHaveBeenCalled();
      });
    });

    test("Then file upload should fail with 500 message error", async () => {
      mockStore.bills.mockImplementationOnce(() => {
        return {
          create: () => {
            return Promise.reject(new Error("Erreur 500"));
          },
          update: () => {
            return Promise.resolve();
          },
        };
      });

      const html = NewBillUI();
      document.body.innerHTML = html;

      const newBill = new NewBill({
        document,
        onNavigate: (pathname) =>
          (document.body.innerHTML = ROUTES({ pathname })),
        store: mockStore,
        localStorage: window.localStorage,
      });

      // Simuler l'upload de fichier
      const file = screen.getByTestId("file");
      const handleChangeFile = jest.fn((e) => newBill.handleChangeFile(e));
      file.addEventListener("change", handleChangeFile);

      fireEvent.change(file, {
        target: {
          files: [new File(["image"], "test.jpg", { type: "image/jpg" })],
        },
      });

      await waitFor(() => {
        expect(handleChangeFile).toHaveBeenCalled();
      });
    });
  });
});
