// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDO88AQi-1os2_2IxgT-CTKcqEVRCS3QOs",
  authDomain: "megasena-4e96c.firebaseapp.com",
  projectId: "megasena-4e96c",
  storageBucket: "megasena-4e96c.firebasestorage.app",
  messagingSenderId: "566660402717",
  appId: "1:566660402717:web:9749c9850172c01a4040f4",
  measurementId: "G-YXD88VECVC"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

document.addEventListener('DOMContentLoaded', () => {
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');

    const gameTypeSelect = document.getElementById('game-type');
    const sortButton = document.getElementById('sort-button');
    const sortedNumbersDiv = document.getElementById('sorted-numbers');

    const desdobramentoGameTypeSelect = document.getElementById('desdobramento-game-type');
    const totalNumbersInput = document.getElementById('total-numbers');
    const numGamesInput = document.getElementById('num-games');
    const randomInput = document.getElementById('random-input');
    const manualInput = document.getElementById('manual-input');
    const manualNumbersTextarea = document.getElementById('manual-numbers');
    const generateCombinationsButton = document.getElementById('generate-combinations');
    const combinationsOutput = document.getElementById('combinations-output');

    const historyTypeSelect = document.getElementById('history-type');
    const historyList = document.getElementById('history-list');

    // Histórico de sorteios e desdobramentos
    let sorteioHistory = JSON.parse(localStorage.getItem('sorteioHistory')) || [];
    let desdobramentoHistory = JSON.parse(localStorage.getItem('desdobramentoHistory')) || [];

    // --- Funções de Aba ---
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));

            button.classList.add('active');
            document.getElementById(button.dataset.tab).classList.add('active');

            if (button.dataset.tab === 'historico') {
                displayHistory();
            }
        });
    });

    // --- Lógica do Sorteador ---
    sortButton.addEventListener('click', () => {
        const gameType = gameTypeSelect.value;
        let numCount, maxNumber;

        switch (gameType) {
            case 'mega-sena':
                numCount = 6;
                maxNumber = 60;
                break;
            case 'quina':
                numCount = 5;
                maxNumber = 80;
                break;
            case 'lotofacil':
                numCount = 15;
                maxNumber = 25;
                break;
            default:
                return;
        }

        const sorted = generateUniqueNumbers(numCount, maxNumber);
        displaySortedNumbers(sorted, gameType);
        addSortToHistory(gameType, sorted);
    });

    function generateUniqueNumbers(count, max) {
        const numbers = new Set();
        while (numbers.size < count) {
            numbers.add(Math.floor(Math.random() * max) + 1);
        }
        return Array.from(numbers).sort((a, b) => a - b);
    }

    function displaySortedNumbers(numbers, gameType) {
        sortedNumbersDiv.innerHTML = '';
        sortedNumbersDiv.className = `sorted-numbers ${gameType}`; // Adiciona classe para estilização CSS

        numbers.forEach(num => {
            const numBall = document.createElement('div');
            numBall.classList.add('number-ball');
            numBall.textContent = String(num).padStart(2, '0');
            sortedNumbersDiv.appendChild(numBall);
        });
    }

    // --- Lógica do Desdobramento ---
    randomInput.addEventListener('change', () => {
        manualNumbersTextarea.style.display = randomInput.checked ? 'none' : 'block';
    });

    manualInput.addEventListener('change', () => {
        manualNumbersTextarea.style.display = manualInput.checked ? 'block' : 'none';
    });

    generateCombinationsButton.addEventListener('click', () => {
        const gameType = desdobramentoGameTypeSelect.value;
        const totalNumbers = parseInt(totalNumbersInput.value);
        const numGames = parseInt(numGamesInput.value);

        let gameRules = {};
        switch (gameType) {
            case 'mega-sena':
                gameRules = { min: 1, max: 60, numbersPerGame: 6 };
                break;
            case 'quina':
                gameRules = { min: 1, max: 80, numbersPerGame: 5 };
                break;
            case 'lotofacil':
                gameRules = { min: 1, max: 25, numbersPerGame: 15 };
                break;
        }

        if (totalNumbers < gameRules.numbersPerGame) {
            alert(`Para ${gameType}, o total de dezenas a combinar deve ser no mínimo ${gameRules.numbersPerGame}.`);
            return;
        }

        let selectedNumbers = [];
        if (randomInput.checked) {
            selectedNumbers = generateUniqueNumbers(totalNumbers, gameRules.max);
        } else {
            const manualInputNumbers = manualNumbersTextarea.value
                .split(',')
                .map(num => parseInt(num.trim()))
                .filter(num => !isNaN(num) && num >= gameRules.min && num <= gameRules.max);

            if (manualInputNumbers.length !== totalNumbers) {
                alert(`Você deve inserir exatamente ${totalNumbers} números válidos entre ${gameRules.min} e ${gameRules.max}.`);
                return;
            }
            // Remove duplicatas e ordena
            selectedNumbers = Array.from(new Set(manualInputNumbers)).sort((a, b) => a - b);
            if (selectedNumbers.length !== totalNumbers) {
                alert(`Números duplicados encontrados ou inválidos. Por favor, insira ${totalNumbers} números únicos e válidos.`);
                return;
            }
        }

        const combinations = generateCombinations(selectedNumbers, gameRules.numbersPerGame, numGames);
        displayCombinations(combinations, gameType, selectedNumbers);
        addDesdobramentoToHistory(gameType, selectedNumbers, combinations);
    });

    function generateCombinations(sourceArray, k, numGames) {
        const result = [];
        const n = sourceArray.length;

        function backtrack(currentCombination, start) {
            if (currentCombination.length === k) {
                result.push([...currentCombination]);
                return;
            }
            if (start >= n) {
                return;
            }

            for (let i = start; i < n; i++) {
                currentCombination.push(sourceArray[i]);
                backtrack(currentCombination, i + 1);
                currentCombination.pop();
            }
        }

        backtrack([], 0);

        // Se o número de combinações geradas for maior que o solicitado, sorteamos
        if (result.length > numGames) {
            const finalCombinations = new Set();
            while (finalCombinations.size < numGames) {
                const randomIndex = Math.floor(Math.random() * result.length);
                finalCombinations.add(JSON.stringify(result[randomIndex])); // Adiciona como string para evitar duplicatas de array
            }
            return Array.from(finalCombinations).map(str => JSON.parse(str));
        }
        return result;
    }

    function displayCombinations(combinations, gameType, sourceNumbers) {
        combinationsOutput.innerHTML = `<h3>Dezenas Selecionadas: ${sourceNumbers.map(n => String(n).padStart(2, '0')).join(', ')}</h3>`;
        if (combinations.length === 0) {
            combinationsOutput.innerHTML += '<p>Nenhuma combinação gerada com as dezenas e regras fornecidas.</p>';
            return;
        }

        combinations.forEach((combination, index) => {
            const gameDiv = document.createElement('div');
            gameDiv.innerHTML = `<strong>Jogo ${index + 1}:</strong> `;
            combination.forEach(num => {
                const span = document.createElement('span');
                span.textContent = String(num).padStart(2, '0');
                gameDiv.appendChild(span);
            });
            combinationsOutput.appendChild(gameDiv);
        });
    }

    // --- Lógica do Histórico ---
    historyTypeSelect.addEventListener('change', displayHistory);

    function addSortToHistory(gameType, numbers) {
        const timestamp = new Date().toLocaleString('pt-BR');
        sorteioHistory.unshift({ type: gameType, numbers: numbers, timestamp: timestamp });
        if (sorteioHistory.length > 50) sorteioHistory.pop(); // Limita o histórico
        localStorage.setItem('sorteioHistory', JSON.stringify(sorteioHistory));
        if (historyTypeSelect.value === 'sorteios') {
            displayHistory();
        }
    }

    function addDesdobramentoToHistory(gameType, selectedNumbers, combinations) {
        const timestamp = new Date().toLocaleString('pt-BR');
        desdobramentoHistory.unshift({
            type: gameType,
            selected: selectedNumbers,
            combinations: combinations,
            timestamp: timestamp
        });
        if (desdobramentoHistory.length > 50) desdobramentoHistory.pop(); // Limita o histórico
        localStorage.setItem('desdobramentoHistory', JSON.stringify(desdobramentoHistory));
        if (historyTypeSelect.value === 'desdobramentos') {
            displayHistory();
        }
    }

    function displayHistory() {
        historyList.innerHTML = '';
        const selectedHistoryType = historyTypeSelect.value;

        let historyToDisplay = [];
        if (selectedHistoryType === 'sorteios') {
            historyToDisplay = sorteioHistory;
        } else if (selectedHistoryType === 'desdobramentos') {
            historyToDisplay = desdobramentoHistory;
        }

        if (historyToDisplay.length === 0) {
            historyList.innerHTML = '<li>Nenhum histórico para exibir.</li>';
            return;
        }

        historyToDisplay.forEach(item => {
            const li = document.createElement('li');
            if (selectedHistoryType === 'sorteios') {
                li.innerHTML = `<strong>Sorteio ${capitalizeFirstLetter(item.type)} (${item.timestamp}):</strong> ${item.numbers.map(n => String(n).padStart(2, '0')).join(', ')}`;
            } else if (selectedHistoryType === 'desdobramentos') {
                const combinationsText = item.combinations.map((comb, idx) => `Jogo ${idx + 1}: ${comb.map(n => String(n).padStart(2, '0')).join(', ')}`).join('; ');
                li.innerHTML = `<strong>Desdobramento ${capitalizeFirstLetter(item.type)} (${item.timestamp}):</strong> Dezenas selecionadas: ${item.selected.map(n => String(n).padStart(2, '0')).join(', ')}. Combinações: ${combinationsText}`;
            }
            historyList.appendChild(li);
        });
    }

    function capitalizeFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }

    // Inicializa a exibição das abas e histórico
    document.querySelector('.tab-button.active').click();
});