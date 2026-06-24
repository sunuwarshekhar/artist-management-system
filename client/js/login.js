(async () => {
  if (!auth.isLoggedIn()) return;

  const user = await auth.requireAuth();
  if (user) {
    window.location.href = auth.getPostLoginRedirect(user);
  }
})();

const form = document.getElementById("login-form");
const errorMessage = document.getElementById("error");
const successMessage = document.getElementById("success");

function showRegistrationSuccess() {
  if (sessionStorage.getItem("registrationSuccess") !== "1") return;

  sessionStorage.removeItem("registrationSuccess");

  if (successMessage) {
    successMessage.textContent = "Account created successfully. Please log in.";
  }
}

showRegistrationSuccess();

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  errorMessage.textContent = "";
  if (successMessage) successMessage.textContent = "";

  try {
    const res = await apiRequest("POST", "/api/auth/login", {
      email: form.email.value,
      password: form.password.value,
    });

    auth.save(res.data.token, res.data.user);
    window.location.href = auth.getPostLoginRedirect(res.data.user);
  } catch (error) {
    errorMessage.textContent = error.message;
  }
});
