const canvas = document.querySelector("canvas");

const scoreFeild = document.querySelector("#score");
const startGameBtn = document.querySelector("#startBtn");
const startGameModal = document.querySelector("#startGameModal");
const totalScore = document.querySelector("#totalScore");
const highestScoreFeild = document.querySelector("#highestScoreFeild");
const body = document.querySelector("body");

highestScoreFeild.style.display = 'none';
if(!localStorage.getItem("highestScore")) {
    localStorage.setItem("highestScore", 0);
}

canvas.width = innerWidth; // (Window.innerWidth)
canvas.height = innerHeight;

const ctx = canvas.getContext('2d');

class Player {
    constructor(x, y, radius, color) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
    }
    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        ctx.fillStyle = this.color;
        ctx.fill();
    }
}

class Projectile {
    constructor(x, y, radius, color, velocity) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.velocity = velocity;
    }
    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        ctx.fillStyle = this.color;
        ctx.fill();
    }
    update() {
        this.draw();
        this.x = this.x + this.velocity.x;
        this.y = this.y + this.velocity.y;
    }
}

class Enemy {
    constructor(x, y, radius, color, velocity) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.velocity = velocity;
    }
    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        ctx.fillStyle = this.color;
        ctx.fill();
    }
    update() {
        this.draw();
        this.x = this.x + this.velocity.x;
        this.y = this.y + this.velocity.y;
    }
}

const friction = 0.98;
class Particle {
    constructor(x, y, radius, color, velocity) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.velocity = velocity;
        this.alphaValue = 1;
    }
    draw() {
        ctx.save();
        ctx.globalAlpha = this.alphaValue;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.restore();
    }
    update() {
        this.draw();
        this.velocity.x *= friction;
        this.velocity.y *= friction;
        this.x = this.x + this.velocity.x;
        this.y = this.y + this.velocity.y;
        this.alphaValue -= 0.01;
    }
}

const x = canvas.width / 2;
const y = canvas.height / 2;

let player = new Player(x, y, 15, 'white');
let projectiles;
let enemies;
let particles;

let score;

function init() {
    projectiles = []
    enemies = []
    particles = []
    
    score = 0;
    scoreFeild.innerHTML = score;
    highestScoreFeild.style.display = 'none';
}

function spawnEnemy() {
    setInterval(() => {
        const radius = Math.random() * (30 - 5) + 5; // Min radius -> 5
        let x;
        let y;
        if(Math.random() < 0.5) {
            x = Math.random() < 0.5 ? 0 - radius : canvas.width + radius
            y = Math.random() * canvas.height
        } else {
            x = Math.random() * canvas.width
            y = Math.random() < 0.5 ? 0 - radius : canvas.height + radius
        }
        const color = `hsl(${Math.random() * 360}, 50%, 50%)`;
        
        const angle = Math.atan2( 
            canvas.height / 2 - y,
            canvas.width / 2 - x
        )
    
        const velocity = {
            x : Math.cos(angle),
            y : Math.sin(angle)
        }

        enemies.push(new Enemy(x , y, radius, color, velocity))
    }, 1000)
}

function animate() {
    let requestID = requestAnimationFrame(animate);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    player.draw();
    particles.forEach((particle, particleIndex) => {
        if(particle.alphaValue <= 0) {
            particles.splice(particleIndex, 1);
        } else {
            particle.update();
        }
    })

    projectiles.forEach((projectile, projectileIndex) => {
        projectile.update();

        if(projectile.x + projectile.radius < 0 || 
            projectile.x - projectile.radius > canvas.width ||
            projectile.y + projectile.radius < 0 ||
            projectile.y - projectile.radius > canvas.height
        ) {
            setTimeout(() => {
                projectiles.splice(projectileIndex, 1);
            }, 0)
        }
    })

    enemies.forEach((enemy, index) => {
        enemy.update();
        const dist = Math.hypot(
            player.x - enemy.x,
            player.y - enemy.y
        )
        if(dist - enemy.radius - player.radius < 1) {
            // collision detected between enemy and player

            let audio = document.createElement("audio");
            audio.src = "Sound Effects/GameOver.wav";
            audio.setAttribute("autoplay", true);
            body.appendChild(audio);
            setTimeout(() => {
                audio.remove();
            }, 1000);
        
            cancelAnimationFrame(requestID);

            if(score > localStorage.getItem("highestScore")) {
                highestScoreFeild.style.display = 'block';
                localStorage.setItem("highestScore", score);
            }

            totalScore.innerHTML = score;
            startGameModal.style.display = 'flex';
        }

        projectiles.forEach((projectile, projectileIndex) => {
            const dist = Math.hypot(
                projectile.x - enemy.x,
                projectile.y - enemy.y
            )

            if(dist - enemy.radius - projectile.radius < 1) {
                // collision detected between enemy and projectile

                let audio = document.createElement("audio");
                audio.src = "Sound Effects/EnemyKill.wav";
                audio.setAttribute("autoplay", true);
                body.appendChild(audio);
                setTimeout(() => {
                    audio.remove();
                }, 1000);

                // creating particle explosion
                for(let i = 0; i < enemy.radius * 1.5; i++) {
                    particles.push(new Particle(
                        projectile.x,
                        projectile.y,
                        Math.random() * 2,
                        enemy.color,
                        {
                            x : (Math.random() - 0.5) * (Math.random() * 5),
                            y : (Math.random() - 0.5) * (Math.random() * 5)
                        }
                    ))
                }

                if(enemy.radius - 10 > 5) {
                    // score update when enemy size is shrinked
                    score += 100;
                    scoreFeild.innerHTML = score;

                    gsap.to(enemy, {
                        radius : enemy.radius - 10
                    })
                    setTimeout(() => {
                        projectiles.splice(projectileIndex, 1);
                    }, 0)

                } else {
                    // score update when enemy is removed from the scene
                    score += 250;
                    scoreFeild.innerHTML = score;

                    setTimeout(() => {
                        enemies.splice(index, 1);
                        projectiles.splice(projectileIndex, 1);
                    }, 0)

                }    
            }
        })
    })
}

addEventListener('click', (event) => {
    const angle = Math.atan2(
        event.clientY - canvas.height / 2,
        event.clientX - canvas.width / 2
    )

    const velocity = {
        x : Math.cos(angle) * 5,
        y : Math.sin(angle) * 5
    }

    projectiles.push(new Projectile(x, y, 5, 'white', velocity))
})

startGameBtn.addEventListener('click', () => {
    let audio = document.createElement("audio");
    audio.src = "Sound Effects/StartGame.wav";
    audio.setAttribute("autoplay", true);
    body.appendChild(audio);
    setTimeout(() => {
        audio.remove();
    }, 2000);

    init();
    animate();
    spawnEnemy();
    startGameModal.style.display = 'none';
})