// Classes
class Plant {
    constructor(name, type, wateringFrequency, lastWatered, healthStatus) {
        this.name = name;
        this.type = type;
        this.wateringFrequency = wateringFrequency;
        this.lastWatered = lastWatered;
        this.healthStatus = healthStatus;
        this.image = null;
        this.healthNotes = "";
        this.id = Date.now().toString();
    }

    getDaysSinceWatered() {
        const today = new Date();
        const lastWateredDate = new Date(this.lastWatered);
        const diffTime = Math.abs(today - lastWateredDate);
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    needsWatering() {
        return this.getDaysSinceWatered() >= this.wateringFrequency;
    }
}

class PlantTracker {
    constructor() {
        this.plants = [];
        this.currentPlantId = null;
        this.loadPlants();
    }

    addPlant(plant) {
        this.plants.push(plant);
        this.savePlants();
        this.displayPlants();
    }

    savePlants() {
        localStorage.setItem('plants', JSON.stringify(this.plants));
    }

    loadPlants() {
        const savedPlants = localStorage.getItem('plants');
        if (savedPlants) {
            this.plants = JSON.parse(savedPlants);
        }
        this.displayPlants();
    }

    getPlantById(id) {
        return this.plants.find(plant => plant.id === id);
    }

    displayPlants() {
        const plantsList = document.getElementById('plantsList');
        if (!plantsList) return;
        
        plantsList.innerHTML = '';

        this.plants.forEach(plant => {
            const plantCard = document.createElement('div');
            plantCard.className = 'plant-card clickable';
            plantCard.onclick = () => this.showPlantDetails(plant.id);
            
            const daysSinceWatered = new Plant(
                plant.name,
                plant.type,
                plant.wateringFrequency,
                plant.lastWatered,
                plant.healthStatus
            ).getDaysSinceWatered();

            plantCard.innerHTML = `
                <h3>${plant.name}</h3>
                <p><strong>Type:</strong> ${plant.type}</p>
                <p><strong>Last Watered:</strong> ${daysSinceWatered} days ago</p>
                <p><strong>Health Status:</strong> <span class="status-${plant.healthStatus}">${plant.healthStatus}</span></p>
            `;

            plantsList.appendChild(plantCard);
        });
    }

    showPlantDetails(plantId) {
        const plant = this.getPlantById(plantId);
        if (!plant) return;

        this.currentPlantId = plantId;

        const elements = {
            mainPage: document.getElementById('main-page'),
            detailsPage: document.getElementById('details-page'),
            name: document.getElementById('plant-detail-name'),
            type: document.getElementById('detail-type'),
            watering: document.getElementById('detail-watering'),
            lastWatered: document.getElementById('detail-last-watered'),
            health: document.getElementById('detail-health'),
            notes: document.getElementById('health-notes'),
            saveButton: document.getElementById('save-notes-button'),
            confirmation: document.getElementById('save-confirmation'),
            image: document.getElementById('plant-image')
        };

        if (elements.mainPage) elements.mainPage.style.display = 'none';
        if (elements.detailsPage) elements.detailsPage.style.display = 'block';

        if (elements.name) elements.name.textContent = plant.name;
        if (elements.type) elements.type.textContent = plant.type;
        if (elements.watering) elements.watering.textContent = `Every ${plant.wateringFrequency} days`;
        
        const daysSinceWatered = new Plant(
            plant.name,
            plant.type,
            plant.wateringFrequency,
            plant.lastWatered,
            plant.healthStatus
        ).getDaysSinceWatered();

        if (elements.lastWatered) {
            elements.lastWatered.textContent = `${plant.lastWatered} (${daysSinceWatered} days ago)`;
        }
        
        if (elements.health) elements.health.textContent = plant.healthStatus;
        if (elements.notes) {
            elements.notes.value = plant.healthNotes || '';
            elements.notes.oninput = handleNotesInput;
        }
        if (elements.saveButton) elements.saveButton.disabled = true;
        if (elements.confirmation) elements.confirmation.classList.add('hide');
        
        if (elements.image) {
            elements.image.src = plant.image || '/api/placeholder/400/300';
        }
    }

    updatePlantImage(imageUrl) {
        const plant = this.getPlantById(this.currentPlantId);
        if (plant) {
            plant.image = imageUrl;
            this.savePlants();
        }
    }

    updateHealthNotes(notes) {
        const plant = this.getPlantById(this.currentPlantId);
        if (plant) {
            plant.healthNotes = notes;
            this.savePlants();
            
            // Update button state after saving
            const saveButton = document.getElementById('save-notes-button');
            if (saveButton) {
                saveButton.disabled = true;
            }
        }
    }

    waterCurrentPlant() {
        const plant = this.getPlantById(this.currentPlantId);
        if (plant) {
            plant.lastWatered = new Date().toISOString().split('T')[0];
            this.savePlants();
            this.showPlantDetails(this.currentPlantId);
        }
    }

    deleteCurrentPlant() {
        const index = this.plants.findIndex(p => p.id === this.currentPlantId);
        if (index !== -1) {
            this.plants.splice(index, 1);
            this.savePlants();
            showMainPage();
        }
    }
}

// Initialize plant tracker
const plantTracker = new PlantTracker();

// Event handlers
function showMainPage() {
    const mainPage = document.getElementById('main-page');
    const detailsPage = document.getElementById('details-page');
    
    if (mainPage) mainPage.style.display = 'block';
    if (detailsPage) detailsPage.style.display = 'none';
    
    plantTracker.currentPlantId = null;
    plantTracker.displayPlants();
}

function handleImageUpload(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const image = document.getElementById('plant-image');
            if (image) image.src = e.target.result;
            plantTracker.updatePlantImage(e.target.result);
        };
        reader.readAsDataURL(file);
    }
}

function handleNotesInput() {
    const notesText = document.getElementById('health-notes')?.value || '';
    const saveButton = document.getElementById('save-notes-button');
    const currentPlant = plantTracker.getPlantById(plantTracker.currentPlantId);
    
    if (saveButton && currentPlant) {
        // Enable button if text has changed from saved version
        saveButton.disabled = notesText === currentPlant.healthNotes;
    }
    
    const confirmation = document.getElementById('save-confirmation');
    if (confirmation) {
        confirmation.classList.add('hide');
    }
}

function saveHealthNotes() {
    const notesText = document.getElementById('health-notes')?.value || '';
    const saveButton = document.getElementById('save-notes-button');
    
    // Update the plant's notes
    plantTracker.updateHealthNotes(notesText);
    
    // Disable the save button since we've just saved
    if (saveButton) {
        saveButton.disabled = true;
    }
    
    // Show confirmation message
    const confirmation = document.getElementById('save-confirmation');
    if (confirmation) {
        confirmation.classList.remove('hide');
        setTimeout(() => {
            const confirmationCheck = document.getElementById('save-confirmation');
            if (confirmationCheck) {
                confirmationCheck.classList.add('hide');
            }
        }, 2000);
    }
}

// Add all event listeners when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Add plant form handler
    const form = document.getElementById('addPlantForm');
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const newPlant = new Plant(
                document.getElementById('plantName')?.value || '',
                document.getElementById('plantType')?.value || '',
                parseInt(document.getElementById('wateringFrequency')?.value || '0'),
                document.getElementById('lastWatered')?.value || new Date().toISOString().split('T')[0],
                document.getElementById('healthStatus')?.value || 'healthy'
            );

            plantTracker.addPlant(newPlant);
            e.target.reset();
        });
    }

    // Back button handler
    const backButton = document.getElementById('back-button');
    if (backButton) {
        backButton.addEventListener('click', showMainPage);
    }

    // Image upload handler
    const imageInput = document.getElementById('imageInput');
    if (imageInput) {
        imageInput.addEventListener('change', handleImageUpload);
    }

    // Save notes button handler
    const saveNotesButton = document.getElementById('save-notes-button');
    if (saveNotesButton) {
        saveNotesButton.addEventListener('click', saveHealthNotes);
    }

    // Water and delete button handlers
    const waterButton = document.getElementById('water-button');
    if (waterButton) {
        waterButton.addEventListener('click', () => plantTracker.waterCurrentPlant());
    }

    const deleteButton = document.getElementById('delete-button');
    if (deleteButton) {
        deleteButton.addEventListener('click', () => {
            if (confirm('Are you sure you want to delete this plant?')) {
                plantTracker.deleteCurrentPlant();
            }
        });
    }
});