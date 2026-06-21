if (auth.isLoggedIn()) {
  window.location.href = "dashboard.html";
}

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

    window.location.href = "index.html";
  } catch (error) {
    errorMessage.textContent = error.message;
  }
});
