const visualizationContainer = document.getElementById('visualization-container');

function visualizeData(data) {
    visualizationContainer.innerHTML = '';
    data.forEach((value, index) => {
        const bar = document.createElement('div');
        bar.className = 'bar';
        bar.style.height = `${value * 20}px`;  // Adjust the scaling as needed
        bar.style.left = `${index * 22}px`;  // Adjust the spacing as needed
        visualizationContainer.appendChild(bar);
    });
}

// Example usage
const exampleData = [4, 2, 7, 1, 9, 3];
visualizeData(exampleData);
