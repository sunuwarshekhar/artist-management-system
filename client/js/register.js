(async () => {
  if (!auth.isLoggedIn()) return;

  const user = await auth.requireAuth();
  if (user) {
    window.location.href = auth.getPostLoginRedirect(user);
  }
})();

const form = document.getElementById("register-form");
const errorMessage = document.getElementById("error");

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  errorMessage.textContent = "";

  try {
    await apiRequest("POST", "/api/auth/register", {
      first_name: form.first_name.value,
      last_name: form.last_name.value,
      email: form.email.value,
      password: form.password.value,
      role: form.role.value,
    });

    sessionStorage.setItem("registrationSuccess", "1");
    window.location.href = "index.html";
  } catch (error) {
    errorMessage.textContent = error.message;
  }
});
