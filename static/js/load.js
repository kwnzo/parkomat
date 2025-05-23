// static/js/main.js
class IndexPark {
    constructor() {
        this.parkingSpots = new Map(); // Assuming you have a Map to store parking spots
    }

    loadindexscheme() {
        const element = document.getElementById('loadScheme');
        if (element) {
            element.addEventListener('click', () => {
                console.log('loading');
                const scheme = JSON.parse(localStorage.getItem('parkingScheme'));
                if (!scheme) {
                    this.showNotification('Сохраненные схемы отсутствуют');
                    return;
                }

                document.getElementById('parkingCanvas').innerHTML = '';
                this.parkingSpots.clear();

                Object.entries(scheme).forEach(([id, config]) =>
                    this.createSpotElement(config));

                this.showNotification('Схема успешно загружена!');
            });
        } else {
            console.error('Element not found');
        }
    }

    showNotification(message) {
        // Implement your notification logic here
        console.log(message);
    }
    getTypeColor(type) {
        const colors = {
            standard: '#b3e5fc',
            special: '#ffcdd2',
            vip: '#c8e6c9'
        };
        return colors[type] || '#ffffff';
    }

    createSpotElement(config) {
        const spot = document.createElement('div');
        spot.className = `parking-spot ${config.type} ${config.orientation}`;
        spot.dataset.id = config.id;
        spot.draggable = true;
        
        Object.assign(spot.style, {
            width: `${config.width}px`,
            height: `${config.height}px`,
            left: `${config.x}px`,
            top: `${config.y}px`,
            backgroundColor: this.getTypeColor(config.type)
        });

        spot.innerHTML = `
            <div class="spot-number">${config.id.slice(-4)}</div>
            <div class="spot-type">${config.type.toUpperCase()}</div>
            <div class="spot-size">${config.width}x${config.height}</div>
        `;

        this.parkingSpots.set(config.id, config);
        document.getElementById('parkingCanvas').appendChild(spot);
        const idTooltip = document.createElement('div');
        idTooltip.className = 'spot-id-hover';
        idTooltip.textContent = config.id;
        spot.appendChild(idTooltip);

        // Обработчики для показа ID
        spot.addEventListener('mouseenter', () => {
            idTooltip.style.display = 'block';
        });
        
        spot.addEventListener('mouseleave', () => {
            idTooltip.style.display = 'none';
        });
    }
}

// Instantiate the class
const indexPark = new IndexPark();

// Attach the event listener
indexPark.loadindexscheme();
