class ParkingDesigner {
    constructor() {
        this.parkingSpots = new Map();
        this.selectedType = 'standard';
        this.currentOrientation = 'horizontal';
        this.contextMenuTarget = null;
        this.draggedElement = null;
        
        this.initEventListeners();
        this.loadScheme(); // Автозагрузка при инициализации
        document.getElementById('contextMenu').addEventListener('click', (e) => {
            this.handleContextMenuAction(e);
        });
        document.getElementById('deleteByIdButton').addEventListener('click', () => 
            this.deleteById()
        );
    }

    changeType() {
        const types = ['standard', 'special', 'vip'];
        const newType = prompt(`Введите тип (${types.join('/')}):`);
        
        if (types.includes(newType)) {
            const spot = this.contextMenuTarget;
            const id = spot.dataset.id;
            
            spot.style.backgroundColor = this.getTypeColor(newType);
            spot.querySelector('.spot-type').textContent = newType.toUpperCase();
            
            const config = this.parkingSpots.get(id);
            config.type = newType;
            this.parkingSpots.set(id, config);
        }
    }

    deleteById() {
        const shortId = document.getElementById('deleteIdInput').value
            .trim()
            .toLowerCase();

        // Валидация ввода
        if (!/^[a-f0-9]{4}$/.test(shortId)) {
            this.showNotification('Некорректный ввод. Используйте 0-9 и a-f', 'error');
            return;
        }

        // Поиск совпадений
        const matches = Array.from(this.parkingSpots.keys())
            .filter(fullId => fullId.toLowerCase().endsWith(shortId));

        if (matches.length === 0) {
            this.showNotification('Место не найдено', 'error');
        } else if (matches.length > 1) {
            this.showNotification(
                `Найдено ${matches.length} совпадений. Полные ID: ${matches.join(', ')}`,
                'warning'
            );
        } else {
            const fullId = matches[0];
            this.parkingSpots.delete(fullId);
            document.querySelector(`[data-id="${fullId}"]`).remove();
            this.showNotification(`Место ${shortId.toUpperCase()} удалено`);
            document.getElementById('deleteIdInput').value = '';
        }
    }


    handleContextMenuAction(e) {
        if (!this.contextMenuTarget) return;
        
        const action = e.target.dataset.action;
        switch(action) {
            case 'rotate':
                this.rotateSpot();
                break;
            case 'delete':
                this.deleteSpot();
                break;
            case 'changeType':
                this.changeType();
                break;
        }
        
        this.hideContextMenu();
    }

    initEventListeners() {
        const canvas = document.getElementById('parkingCanvas');
        
        // Обработчики создания мест
        canvas.addEventListener('dblclick', this.handleCanvasClick.bind(this));
        canvas.addEventListener('contextmenu', this.handleContextMenu.bind(this));

        // Обработчики перетаскивания
        canvas.addEventListener('dragstart', this.handleDragStart.bind(this));
        canvas.addEventListener('dragend', this.handleDragEnd.bind(this));

        // Панель инструментов
        document.querySelectorAll('.spot-type').forEach(btn => 
            btn.addEventListener('click', () => this.selectType(btn.dataset.type)))
            
        document.getElementById('saveScheme').addEventListener('click', this.saveScheme.bind(this));
        document.getElementById('loadScheme').addEventListener('click', this.loadScheme.bind(this));
    }

    selectType(type) {
        this.selectedType = type;
        document.querySelectorAll('.spot-type').forEach(b => b.classList.remove('selected'));
        document.querySelector(`[data-type="${type}"]`).classList.add('selected');
    }

    handleCanvasClick(e) {
        const {width, height} = this.getCurrentDimensions();
        const spotId = crypto.randomUUID();
        const {x, y} = this.calculatePosition(e, width, height);
        
        this.createSpotElement({
            id: spotId,
            type: this.selectedType,
            x,
            y,
            width,
            height,
            orientation: this.currentOrientation
            
        });
    }

    getCurrentDimensions() {
        return {
            width: parseInt(document.getElementById('spotWidth').value),
            height: parseInt(document.getElementById('spotHeight').value)
        };
    }

    calculatePosition(e, width, height) {
        return {
            x: e.offsetX - width/2,
            y: e.offsetY - height/2
        };
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

    getTypeColor(type) {
        const colors = {
            standard: '#b3e5fc',
            special: '#ffcdd2',
            vip: '#c8e6c9'
        };
        return colors[type] || '#ffffff';
    }

    handleDragStart(e) {
        if (!e.target.classList.contains('parking-spot')) return;
        
        this.draggedElement = e.target;
        const rect = e.target.getBoundingClientRect();
        
        // Фиксируем смещение курсора относительно элемента
        this.dragOffset = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
        
        e.target.style.opacity = '0.5';
    }

    handleDragEnd(e) {
        if (!this.draggedElement) return;
        
        const canvas = document.getElementById('parkingCanvas');
        const canvasRect = canvas.getBoundingClientRect();
        
        // Корректный расчет позиции с учетом смещения
        const newX = e.clientX - canvasRect.left - this.dragOffset.x;
        const newY = e.clientY - canvasRect.top - this.dragOffset.y;
        
        // Ограничение позиции в пределах холста
        const maxX = canvas.offsetWidth - this.draggedElement.offsetWidth;
        const maxY = canvas.offsetHeight - this.draggedElement.offsetHeight;
        
        Object.assign(this.draggedElement.style, {
            left: `${Math.max(0, Math.min(newX, maxX))}px`,
            top: `${Math.max(0, Math.min(newY, maxY))}px`,
            opacity: '1'
        });

        this.updateSpotPosition(
            this.draggedElement.dataset.id, 
            parseInt(this.draggedElement.style.left),
            parseInt(this.draggedElement.style.top)
        );
        
        this.draggedElement = null;
            }
        
    updateSpotPosition(id, x, y) {
        const config = this.parkingSpots.get(id);
        this.parkingSpots.set(id, {...config, x, y});
    }

    handleContextMenu(e) {
        if (!e.target.classList.contains('parking-spot')) return;
        e.preventDefault();
        
        this.contextMenuTarget = e.target;
        this.showContextMenu(e.pageX, e.pageY);
    }

    showContextMenu(x, y) {
        const menu = document.getElementById('contextMenu');
        Object.assign(menu.style, {
            display: 'block',
            left: `${x}px`,
            top: `${y}px`
        });
    }

    rotateSpot() {
        const spot = this.contextMenuTarget;
        const config = this.parkingSpots.get(spot.dataset.id);
        
        const newOrientation = config.orientation === 'horizontal' 
            ? 'vertical' 
            : 'horizontal';
        
        // Меняем ширину и высоту места
        const [width, height] = [config.height, config.width];
        
        this.updateSpotConfig(spot.dataset.id, {
            orientation: newOrientation,
            width,
            height
        });

        Object.assign(spot.style, {
            width: `${width}px`,
            height: `${height}px`
        });
        
        this.hideContextMenu();
    }



        updateSpotConfig(id, newConfig) {
            const currentConfig = this.parkingSpots.get(id);
            this.parkingSpots.set(id, {...currentConfig, ...newConfig});
        }

        hideContextMenu() {
            document.getElementById('contextMenu').style.display = 'none';
            this.contextMenuTarget = null;
        }

        saveScheme() {
            const scheme = Object.fromEntries(this.parkingSpots);
            localStorage.setItem('parkingScheme', JSON.stringify(scheme));
            this.showNotification('Схема успешно сохранена!');
        }

        loadScheme() {
            const scheme = JSON.parse(localStorage.getItem('parkingScheme'));
            if (!scheme) return this.showNotification('Сохраненные схемы отсутствуют');
            
            document.getElementById('parkingCanvas').innerHTML = '';
            this.parkingSpots.clear();
            
            Object.entries(scheme).forEach(([id, config]) => 
                this.createSpotElement(config));
            
            this.showNotification('Схема успешно загружена!');
        }

        showNotification(message) {
            
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 3000);
    }
}

// Инициализация приложения
    document.addEventListener('DOMContentLoaded', () => new ParkingDesigner());