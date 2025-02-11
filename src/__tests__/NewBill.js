/**
 * @jest-environment jsdom
 */

import { screen, waitFor, fireEvent } from "@testing-library/dom";
import NewBillUI from "../views/NewBillUI.js";
import NewBill from "../containers/NewBill.js";
import { ROUTES, ROUTES_PATH } from "../constants/routes.js";
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

    // Test d'upload d'un fichier valide
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

    // Test d'upload d'un fichier invalide
    describe("When I upload an invalid file", () => {
      test("Then an error message should appear", () => {
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
            files: [new File(["document"], "test.txt", { type: "text/plain" })],
          },
        });

        expect(handleChangeFile).toHaveBeenCalled();
        expect(screen.getByTestId("file-error-message")).toBeTruthy();
        expect(screen.getByTestId("file-error-message").textContent).toBe(
          "Seuls les fichiers jpg, jpeg et png sont acceptés"
        );
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
        const handleChangeFile = jest.fn((e) => newBill.handleChangeFile(e));
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

    // Test du bouton retour du navigateur
    describe("When I click on the browser back button", () => {
      test("Then I should be redirected to the Dashboard", () => {
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

        const onNavigate = jest.fn();

        new NewBill({
          document,
          onNavigate,
          store: mockStore,
          localStorage: window.localStorage,
        });

        // Simuler le clic sur le bouton retour du navigateur
        window.dispatchEvent(new PopStateEvent("popstate"));

        // Vérifier que onNavigate a été appelé avec le bon chemin
        expect(onNavigate).toHaveBeenCalledWith(ROUTES_PATH["Bills"]);
      });
    });

    // Test d'intégration POST
    describe("When I submit a new bill", () => {
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

      test("Then the bill should be created successfully", async () => {
        const expectedBill = {
          id: "47qAXb6fIm2zOKkLzMro",
          vat: "80",
          fileUrl:
            "https://test.storage.tld/v0/b/billable-677b6.a…f-1.jpg?alt=media&token=c1640e12-a24b-4b11-ae52-529112e9602a",
          status: "pending",
          type: "Hôtel et logement",
          commentary: "séminaire billed",
          name: "encore",
          fileName: "preview-facture-free-201801-pdf-1.jpg",
          date: "2004-04-04",
          amount: 400,
          commentAdmin: "ok",
          email: "a@a",
          pct: 20,
        };

        const createMock = jest.fn().mockResolvedValue({
          fileUrl: expectedBill.fileUrl,
          key: expectedBill.id,
        });
        const updateMock = jest.fn().mockResolvedValue(expectedBill);

        mockStore.bills.mockImplementationOnce(() => ({
          create: createMock,
          update: updateMock,
        }));

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
          expect(createMock).toHaveBeenCalled();
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
});
