import { ROUTES_PATH } from "../constants/routes.js";
import Logout from "./Logout.js";

export default class NewBill {
  constructor({ document, onNavigate, store, localStorage }) {
    this.document = document;
    this.onNavigate = onNavigate;
    this.store = store;
    const formNewBill = this.document.querySelector(
      `form[data-testid="form-new-bill"]`
    );
    formNewBill.addEventListener("submit", this.handleSubmit);
    const file = this.document.querySelector(`input[data-testid="file"]`);
    file.addEventListener("change", this.handleChangeFile);
    this.fileUrl = null;
    this.fileName = null;
    this.billId = null;
    new Logout({ document, localStorage, onNavigate });

    // Ajouter le gestionnaire d'événement pour le bouton retour
    window.addEventListener("popstate", () => {
      this.onNavigate(ROUTES_PATH["Bills"]);
    });
  }

  handleChangeFile = (e) => {
    e.preventDefault();
    const fileInput = this.document.querySelector(`input[data-testid="file"]`);
    const errorMessage = this.document.querySelector(
      `[data-testid="file-error-message"]`
    );
    // Create error message if needed
    if (!errorMessage) {
      const errorDiv = this.document.createElement("div");
      errorDiv.setAttribute("data-testid", "file-error-message");
      errorDiv.style.color = "red";
      errorDiv.style.marginTop = "5px";
      fileInput.parentNode.insertBefore(errorDiv, fileInput.nextSibling);
    }
    const file = fileInput.files[0];

    if (!file) return;

    const fileName = file.name;
    const fileExtension = fileName.split(".").pop().toLowerCase();
    const allowedExtensions = ["jpg", "jpeg", "png"];

    // fix: [Bug hunt] - Bills
    if (!allowedExtensions.includes(fileExtension)) {
      fileInput.value = ""; // Reset the input
      this.document.querySelector(
        `[data-testid="file-error-message"]`
      ).textContent = "Seuls les fichiers jpg, jpeg et png sont acceptés";
      this.fileUrl = null;
      this.fileName = null;
      return;
    }

    // Clear error message if file is valid
    this.document.querySelector(
      `[data-testid="file-error-message"]`
    ).textContent = "";

    const formData = new FormData();
    const email = JSON.parse(localStorage.getItem("user")).email;
    formData.append("file", file);
    formData.append("email", email);

    this.store
      .bills()
      .create({
        data: formData,
        headers: {
          noContentType: true,
        },
      })
      .then(({ fileUrl, key }) => {
        this.billId = key;
        this.fileUrl = fileUrl;
        this.fileName = fileName;
      })
      .catch((error) => {
        console.error(error);
        this.document.querySelector(
          `[data-testid="file-error-message"]`
        ).textContent = "Erreur lors du téléchargement du fichier";
        fileInput.value = "";
        this.fileUrl = null;
        this.fileName = null;
      });
  };

  handleSubmit = (e) => {
    e.preventDefault();
    console.log(
      'e.target.querySelector(`input[data-testid="datepicker"]`).value',
      e.target.querySelector(`input[data-testid="datepicker"]`).value
    );
    const email = JSON.parse(localStorage.getItem("user")).email;
    const bill = {
      email,
      type: e.target.querySelector(`select[data-testid="expense-type"]`).value,
      name: e.target.querySelector(`input[data-testid="expense-name"]`).value,
      amount: parseInt(
        e.target.querySelector(`input[data-testid="amount"]`).value
      ),
      date: e.target.querySelector(`input[data-testid="datepicker"]`).value,
      vat: e.target.querySelector(`input[data-testid="vat"]`).value,
      pct:
        parseInt(e.target.querySelector(`input[data-testid="pct"]`).value) ||
        20,
      commentary: e.target.querySelector(`textarea[data-testid="commentary"]`)
        .value,
      fileUrl: this.fileUrl,
      fileName: this.fileName,
      status: "pending",
    };
    this.updateBill(bill);
    this.onNavigate(ROUTES_PATH["Bills"]);
  };

  // not need to cover this function by tests
  updateBill = (bill) => {
    if (this.store) {
      this.store
        .bills()
        .update({ data: JSON.stringify(bill), selector: this.billId })
        .then(() => {
          this.onNavigate(ROUTES_PATH["Bills"]);
        })
        .catch((error) => console.error(error));
    }
  };
}
