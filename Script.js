let money = 0;
let earnPerCycle = 10;
let cycleTime = 5000;

let working = {};

document.querySelectorAll(".clickable").forEach(img => {

    img.addEventListener("click", () => {

        const id = img.dataset.id;
        const barra = document.getElementById("barra-" + id);

        if (!barra) {
            console.error("ERRO: Barra não encontrada para", id);
            return;
        }

        if (working[id]) return;
        working[id] = true;

        /* LIMPA A BARRA */
        barra.innerHTML = "";

        /* CRIA ELEMENTOS */
        let fill = document.createElement("div");
        fill.classList.add("barra-fill");

        let timer = document.createElement("div");
        timer.classList.add("barra-timer");

        barra.appendChild(fill);
        barra.appendChild(timer);

        /* Define duração da animação */
        fill.style.transitionDuration = (cycleTime / 1000) + "s";

        /* Inicia barra */
        setTimeout(() => fill.style.width = "100%", 20);

        /* Timer regressivo */
        let timeLeft = cycleTime;
        timer.innerText = (timeLeft / 1000).toFixed(1) + "s";

        let interval = setInterval(() => {
            timeLeft -= 100;
            if (timeLeft <= 0) {
                clearInterval(interval);
                timer.innerText = "0.0s";
            } else {
                timer.innerText = (timeLeft / 1000).toFixed(1) + "s";
            }
        }, 100);

        /* QUANDO A BARRA TERMINA */
        setTimeout(() => {

            money += earnPerCycle;
            document.getElementById("money").textContent = money;

            /* Reset visual */
            fill.style.transitionDuration = "0s";
            fill.style.width = "0%";
            timer.innerText = "";

            working[id] = false;

        }, cycleTime);

    });

});