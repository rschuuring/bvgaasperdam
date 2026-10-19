// Menu op de telefoon open en dicht klappen.
document.getElementById("menu-btn").addEventListener("click", e => {
  const open = document.getElementById("nav").classList.toggle("open");
  e.currentTarget.setAttribute("aria-expanded", open);
});

// Op de testversie (GitHub Pages) kan het formulier nog niets versturen.
const form = document.getElementById("signup");
if (form && location.hostname.endsWith("github.io")) {
  form.addEventListener("submit", e => {
    e.preventDefault();
    document.getElementById("signup-demo").hidden = false;
  });
}
