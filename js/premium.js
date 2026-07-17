/* premium.js — Premium + payment flow */
const Premium = {
  init() {
    document.getElementById("tryPremium").addEventListener("click", () => {
      document.getElementById("payPlan").textContent = "Standard";
      MelodifyStorage.set("pendingPlan", "Standard");
      switchView("payment");
    });
    document.querySelectorAll("[data-plan]").forEach((b) =>
      b.addEventListener("click", () => {
        const plan = b.dataset.plan;
        document.getElementById("payPlan").textContent = plan;
        MelodifyStorage.set("pendingPlan", plan);
        switchView("payment");
      }),
    );
    document.querySelectorAll(".pay-method").forEach((b) =>
      b.addEventListener("click", () => {
        document.getElementById("paySuccess").classList.remove("hidden");
        document.querySelector(".pay-methods").style.display = "none";
        MelodifyStorage.set("premium", true);
      }),
    );
    document.getElementById("paySuccessOk").addEventListener("click", () => {
      document.getElementById("paySuccess").classList.add("hidden");
      document.querySelector(".pay-methods").style.display = "";
      switchView("home");
      toast("Welcome to Melodify Premium ✨");
    });
  },
};
window.Premium = Premium;
