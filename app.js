// Agregar una nueva idea
var db = firebase.firestore()

// Agregar el siguiente código al principio de tu archivo app.js
document.addEventListener("dragover", function(event) {
    event.preventDefault();
});

document.addEventListener("drop", function(event) {
    event.preventDefault();
});

function drop(event) {
    event.preventDefault();
    var ideaId = event.dataTransfer.getData('text/plain');
    var confirmMove = confirm('¿Estás seguro de mover esta idea a Progreso?');
    if (confirmMove) {
        db.collection('ideas').doc(ideaId).update({ status: 'progreso' }).then(function() {
            updateLists();
            updateChart();
        });
    }
}

function allowDrop(event) {
    event.preventDefault();
}


document.getElementById('addIdea').addEventListener('click', () => {
    const ideaText = document.getElementById('newIdea').value;
    db.collection('ideas').add({ text: ideaText, status: 'hielera' })
    .then(() => {
        document.getElementById('newIdea').value = '';
        updateLists();
        updateChart();
    }); 

});

// Actualizar listas
function updateLists() {
    const ideasList = document.getElementById('ideasList');
    const progressList = document.getElementById('progressList');

    ideasList.innerHTML = '';
    progressList.innerHTML = '';

    db.collection('ideas').get().then((querySnapshot) => {
        querySnapshot.forEach((doc) => {
            const idea = doc.data();
            const listItem = document.createElement('li');
            listItem.className = 'list-group-item';
            listItem.textContent = idea.text;

            if (idea.status === 'hielera') {
                listItem.draggable = true;
                listItem.addEventListener('dragstart', (e) => {
                    e.dataTransfer.setData('text/plain', doc.id);
                });

                listItem.addEventListener('dblclick', () => {
                    const confirmDelete = confirm('¿Estás seguro de eliminar esta idea?');
                    if (confirmDelete) {
                        db.collection('ideas').doc(doc.id).delete().then(() => {
                            updateLists();
                            updateChart();
                        });
                    }
                });

                ideasList.appendChild(listItem);
            } else if (idea.status === 'progreso') {
                progressList.appendChild(listItem);
            }
        });
        
        // Actualizar el gráfico
        updateChart();
    });
}

// Inicializar gráfico circular
function updateChart() {
    db.collection('ideas').get().then((querySnapshot) => {
        const ideas = querySnapshot.docs.map(doc => doc.data().status);
        const hieleraCount = ideas.filter(status => status === 'hielera').length;
        const progresoCount = ideas.filter(status => status === 'progreso').length;

        const ctx = document.getElementById('chart').getContext('2d');
        if (window.myDoughnut) {
            window.myDoughnut.destroy();
        }
        window.myDoughnut = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Hielera', 'Progreso'],
                datasets: [{
                    data: [hieleraCount, progresoCount],
                    backgroundColor: [
                        'rgba(255, 99, 132, 0.5)',
                        'rgba(54, 162, 235, 0.5)'
                    ],
                    borderWidth: 1
                }]
            },
        });
    });
}

// Event listener para soltar una idea
document.getElementById('progressList').addEventListener('dragover', (e) => e.preventDefault());

document.getElementById('progressList').addEventListener('drop', (e) => {
    e.preventDefault();
    const ideaId = e.dataTransfer.getData('text/plain');
    const confirmMove = confirm('¿Estás seguro de mover esta idea a Progreso?');
    if (confirmMove) {
        db.collection('ideas').doc(ideaId).update({ status: 'progreso' }).then(() => {
            updateLists();
            updateChart();
        });
    }
});

// Event listener para eliminar una idea en la tercera columna
document.getElementById('progressList').addEventListener('dblclick', (e) => {
    const listItem = e.target;
    const ideaText = listItem.textContent;

    const confirmDelete = confirm(`¿Estás seguro de eliminar la idea "${ideaText}"?`);
    if (confirmDelete) {
        db.collection('ideas').where('text', '==', ideaText).get().then((querySnapshot) => {
            querySnapshot.forEach((doc) => {
                db.collection('ideas').doc(doc.id).delete().then(() => {
                    updateLists();
                    updateChart();
                });
            });
        });
    }
});


// Actualizar listas al cargar la página
updateLists();
