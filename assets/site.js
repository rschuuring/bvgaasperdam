// Menu op de telefoon open en dicht klappen.
document.getElementById("menu-btn").addEventListener("click", e => {
  const open = document.getElementById("nav").classList.toggle("open");
  e.currentTarget.setAttribute("aria-expanded", open);
});

