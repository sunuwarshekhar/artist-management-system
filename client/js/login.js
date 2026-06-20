const form = document.getElementById("login-form");
const errorMessage = document.getElementById("error");

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  errorMessage.textContent = "";

  try {
    const res = await apiRequest("POST", "/api/auth/login", {
      email: form.email.value,
      password: form.password.value,
    });

    auth.save(res.data.token, res.data.user);
    window.location.href = "dashboard.html";
  } catch (error) {
    errorMessage.textContent = error.message;
  }
});
