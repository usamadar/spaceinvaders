class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = 800;
        this.canvas.height = 600;
        
        this.player = {
            x: this.canvas.width / 2,
            y: this.canvas.height - 50,
            width: 50,
            height: 30,
            speed: 5
        };
        
        this.bullets = [];
        this.enemies = [];
        this.score = 0;
        this.lives = 3;
        this.gameOver = false;
        
        this.keys = {};
        this.enemyRows = 5;
        this.enemyCols = 8;
        this.enemyWidth = 40;
        this.enemyHeight = 40;
        this.enemyPadding = 20;
        
        this.wave = 1;
        this.enemySpeed = 1;  // Base enemy speed
        
        this.enemyShapes = ['hexagon', 'triangle', 'square', 'circle', 'star'];
        this.currentShape = 'hexagon';
        this.enemyRotation = 0;
        this.rotationSpeed = 0.02;
        
        this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        this.gameLoopRunning = true;
        
        // Adjust canvas size for mobile
        if (this.isMobile) {
            this.resizeCanvas();
            window.addEventListener('resize', () => this.resizeCanvas());
            this.setupMobileControls();
        }
        
        this.initializeEnemies();
        this.setupEventListeners();
        this.gameLoop();
    }
    
    initializeEnemies() {
        for (let row = 0; row < this.enemyRows; row++) {
            for (let col = 0; col < this.enemyCols; col++) {
                this.enemies.push({
                    x: col * (this.enemyWidth + this.enemyPadding) + 50,
                    y: row * (this.enemyHeight + this.enemyPadding) + 50,
                    width: this.enemyWidth,
                    height: this.enemyHeight,
                    direction: 1,
                    speed: this.enemySpeed
                });
            }
        }
    }
    
    setupEventListeners() {
        window.addEventListener('keydown', (e) => this.keys[e.key] = true);
        window.addEventListener('keyup', (e) => this.keys[e.key] = false);
        window.addEventListener('keypress', (e) => {
            if (e.key === ' ' && !this.gameOver) {
                this.shoot();
            }
        });
        
        const restartButton = document.getElementById('restartButton');
        restartButton.removeEventListener('click', () => this.restart());
        restartButton.addEventListener('click', () => {
            this.restart();
            document.getElementById('gameOver').classList.add('hidden');
        });
    }
    
    shoot() {
        this.bullets.push({
            x: this.player.x + this.player.width / 2,
            y: this.player.y,
            width: 4,
            height: 10,
            speed: 7
        });
    }
    
    update() {
        if (this.gameOver) return;
        
        // Add new wave when all enemies are destroyed
        if (this.enemies.length === 0) {
            this.startNewWave();
        }
        
        // Player movement
        if (this.keys['ArrowLeft'] && this.player.x > 0) {
            this.player.x -= this.player.speed;
        }
        if (this.keys['ArrowRight'] && this.player.x < this.canvas.width - this.player.width) {
            this.player.x += this.player.speed;
        }
        
        // Update bullets
        this.bullets.forEach((bullet, index) => {
            bullet.y -= bullet.speed;
            if (bullet.y < 0) {
                this.bullets.splice(index, 1);
            }
        });
        
        // Update enemies
        let touchedEdge = false;
        this.enemies.forEach(enemy => {
            enemy.x += enemy.speed * enemy.direction;
            if (enemy.x <= 0 || enemy.x + enemy.width >= this.canvas.width) {
                touchedEdge = true;
            }
        });
        
        if (touchedEdge) {
            this.enemies.forEach(enemy => {
                enemy.direction *= -1;
                enemy.y += 20;
            });
        }
        
        // Check collisions
        this.checkCollisions();
        
        // Check if enemies reached bottom
        if (this.enemies.some(enemy => enemy.y + enemy.height >= this.player.y)) {
            this.endGame();
        }
    }
    
    checkCollisions() {
        this.bullets.forEach((bullet, bulletIndex) => {
            this.enemies.forEach((enemy, enemyIndex) => {
                if (this.collision(bullet, enemy)) {
                    this.bullets.splice(bulletIndex, 1);
                    this.enemies.splice(enemyIndex, 1);
                    this.score += 100;
                    document.getElementById('score').textContent = this.score;
                }
            });
        });
    }
    
    collision(bullet, enemy) {
        // Calculate the center of the bullet
        const bulletCenterX = bullet.x + bullet.width / 2;
        const bulletCenterY = bullet.y + bullet.height / 2;
        
        // Calculate the center of the enemy
        const enemyCenterX = enemy.x + enemy.width / 2;
        const enemyCenterY = enemy.y + enemy.height / 2;
        
        // Calculate the distance between centers
        const dx = bulletCenterX - enemyCenterX;
        const dy = bulletCenterY - enemyCenterY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Check if the distance is less than the sum of the radii
        // Using enemy.width/2 as the enemy's radius and 4 as bullet's radius
        return distance < (enemy.width / 2 + 4);
    }
    
    draw() {
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw player (triangle spaceship)
        this.ctx.fillStyle = '#00ff00';
        this.ctx.beginPath();
        this.ctx.moveTo(this.player.x + this.player.width / 2, this.player.y); // Top point
        this.ctx.lineTo(this.player.x, this.player.y + this.player.height); // Bottom left
        this.ctx.lineTo(this.player.x + this.player.width, this.player.y + this.player.height); // Bottom right
        this.ctx.closePath();
        this.ctx.fill();
        
        // Draw bullets (circles)
        this.ctx.fillStyle = '#fff';
        this.bullets.forEach(bullet => {
            this.ctx.beginPath();
            this.ctx.arc(
                bullet.x + bullet.width / 2,
                bullet.y + bullet.height / 2,
                4, // radius
                0,
                Math.PI * 2
            );
            this.ctx.fill();
        });
        
        // Update enemy rotation
        this.enemyRotation += this.rotationSpeed;
        
        // Draw enemies with rotation
        this.ctx.fillStyle = '#ff0000';
        this.enemies.forEach(enemy => {
            this.ctx.save();
            this.ctx.translate(
                enemy.x + enemy.width / 2,
                enemy.y + enemy.height / 2
            );
            this.ctx.rotate(this.enemyRotation);
            
            switch(this.currentShape) {
                case 'hexagon':
                    this.drawHexagon(0, 0, enemy.width / 2);
                    break;
                case 'triangle':
                    this.drawTriangle(0, 0, enemy.width / 2);
                    break;
                case 'square':
                    this.drawSquare(0, 0, enemy.width / 2);
                    break;
                case 'circle':
                    this.drawCircle(0, 0, enemy.width / 2);
                    break;
                case 'star':
                    this.drawStar(0, 0, enemy.width / 2);
                    break;
            }
            
            this.ctx.restore();
        });
    }
    
    drawHexagon(x, y, size) {
        this.ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = (Math.PI / 3) * i;
            const xPoint = x + size * Math.cos(angle);
            const yPoint = y + size * Math.sin(angle);
            if (i === 0) {
                this.ctx.moveTo(xPoint, yPoint);
            } else {
                this.ctx.lineTo(xPoint, yPoint);
            }
        }
        this.ctx.closePath();
        this.ctx.fill();
    }
    
    drawTriangle(x, y, size) {
        this.ctx.beginPath();
        this.ctx.moveTo(x, y - size);
        this.ctx.lineTo(x - size, y + size);
        this.ctx.lineTo(x + size, y + size);
        this.ctx.closePath();
        this.ctx.fill();
    }
    
    drawSquare(x, y, size) {
        this.ctx.fillRect(-size, -size, size * 2, size * 2);
    }
    
    drawCircle(x, y, size) {
        this.ctx.beginPath();
        this.ctx.arc(x, y, size, 0, Math.PI * 2);
        this.ctx.fill();
    }
    
    drawStar(x, y, size) {
        this.ctx.beginPath();
        for (let i = 0; i < 5; i++) {
            const angle = (Math.PI * 2 * i) / 5 - Math.PI / 2;
            const outerX = x + Math.cos(angle) * size;
            const outerY = y + Math.sin(angle) * size;
            if (i === 0) {
                this.ctx.moveTo(outerX, outerY);
            } else {
                this.ctx.lineTo(outerX, outerY);
            }
            
            const innerAngle = angle + Math.PI / 5;
            const innerX = x + Math.cos(innerAngle) * (size / 2);
            const innerY = y + Math.sin(innerAngle) * (size / 2);
            this.ctx.lineTo(innerX, innerY);
        }
        this.ctx.closePath();
        this.ctx.fill();
    }
    
    endGame() {
        this.gameOver = true;
        document.getElementById('gameOver').classList.remove('hidden');
        document.getElementById('finalScore').textContent = this.score;
    }
    
    restart() {
        this.enemies = [];
        this.bullets = [];
        this.score = 0;
        this.lives = 3;
        this.gameOver = false;
        this.wave = 1;
        this.enemySpeed = 1;
        this.player.x = this.canvas.width / 2;
        
        // Reset all game states
        document.getElementById('score').textContent = this.score;
        document.getElementById('lives').textContent = this.lives;
        document.getElementById('wave').textContent = this.wave;
        
        // Reset enemy properties
        this.enemyRotation = 0;
        this.rotationSpeed = 0.02;
        this.currentShape = 'hexagon';
        
        // Initialize new enemies
        this.initializeEnemies();
        
        // Ensure game loop continues
        if (!this.gameLoopRunning) {
            this.gameLoop();
        }
        
        if (this.isMobile) {
            this.resizeCanvas();
        }
    }
    
    gameLoop() {
        this.update();
        this.draw();
        requestAnimationFrame(() => this.gameLoop());
    }
    
    startNewWave() {
        this.wave++;
        this.enemySpeed = Math.min(1 + (this.wave * 0.2), 3);
        
        // Change enemy shape
        this.currentShape = this.enemyShapes[(this.wave - 1) % this.enemyShapes.length];
        
        // Increase rotation speed slightly with each wave
        this.rotationSpeed = 0.02 + (this.wave * 0.005);
        
        // Reset enemy positions
        for (let row = 0; row < this.enemyRows; row++) {
            for (let col = 0; col < this.enemyCols; col++) {
                this.enemies.push({
                    x: col * (this.enemyWidth + this.enemyPadding) + 50,
                    y: row * (this.enemyHeight + this.enemyPadding) + 50,
                    width: this.enemyWidth,
                    height: this.enemyHeight,
                    direction: 1,
                    speed: this.enemySpeed
                });
            }
        }
        
        document.getElementById('wave').textContent = this.wave;
    }
    
    resizeCanvas() {
        const container = document.querySelector('.game-container');
        this.canvas.width = container.clientWidth;
        this.canvas.height = container.clientHeight;
        
        // Adjust player position
        this.player.y = this.canvas.height - 50;
        this.player.x = this.canvas.width / 2;
        
        // Scale enemy positions
        this.enemyWidth = Math.min(40, this.canvas.width / 15);
        this.enemyHeight = this.enemyWidth;
        this.enemyPadding = this.enemyWidth / 2;
    }
    
    setupMobileControls() {
        let touchStartX = 0;
        let isShooting = false;
        
        // Add touch event listeners to the canvas
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            touchStartX = e.touches[0].clientX;
            
            // Start shooting
            if (!this.gameOver) {
                isShooting = true;
                this.shoot();
                this.shootInterval = setInterval(() => {
                    if (isShooting && !this.gameOver) {
                        this.shoot();
                    }
                }, 300); // Shoot every 300ms while touching
            }
        });
        
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const touchX = e.touches[0].clientX;
            const deltaX = touchX - touchStartX;
            
            // Move player based on finger movement
            this.player.x += deltaX / 2; // Adjust sensitivity as needed
            
            // Keep player within bounds
            this.player.x = Math.max(0, Math.min(this.canvas.width - this.player.width, this.player.x));
            
            touchStartX = touchX;
        });
        
        this.canvas.addEventListener('touchend', () => {
            // Stop shooting
            isShooting = false;
            clearInterval(this.shootInterval);
        });
    }
}

// Start the game when the page loads
window.onload = () => {
    new Game();
}; 