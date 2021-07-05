const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

canvas.height = window.innerHeight-10;
canvas.width = window.innerWidth-10;

let frame = 0;
let score = 0;
let gameover = false;
let restart = false;
let startGame = false;

const playerTemplate = {
    x: 100,
    y: 100,
    width: 70,
    height: 150,
    dx: 0,
    dy: 0,
    speedX: 3,
    speedY: 4,
    left: 0,
    top: 0
}

var player = {};
player = Object.assign(player, playerTemplate);

//images for animation
let jetpackman = new Image();
let bulletImg = new Image();
let asteroidImg = new Image();
let kaboom = new Image();
let background = new Image();
let background2 = new Image();
let background3 = new Image();
let gameoverImg = new Image();
let bulletLogo = new Image();

jetpackman.src = "./assets/jetpackflying.png";
bulletImg.src = "./assets/fire.png";
asteroidImg.src = "./assets/asteroid.png";
kaboom.src = "./assets/kaboom.png";
background.src = "./assets/back-ground.png";
background2.src = "./assets/back-ground.png";
background3.src = "./assets/back-ground.png";
gameoverImg.src = "./assets/over-background.png";
bulletLogo.src = "./assets/bullet.png";

//audio stuff
let gunshot = new Audio();
let asteroidHit = new Audio();
let crash = new Audio();
let gameMusic = new Audio();

gunshot.src = "./assets/audio/gunshot.wav";
asteroidHit.src = "./assets/audio/asteroidboom.wav";
crash.src = "./assets/audio/explosion.mp3";
gameMusic.src = "./assets/audio/gamemusic.mp3";
gameMusic.loop = true;

window.addEventListener("keydown", (e)=>{
    if(!startGame){
        startGame = true;
        frame = 0;
    }
    if(gameover || !startGame){
        return;
    }
    switch(e.key){
        case "w":
        case "ArrowUp":
            player.dy = player.speedY;
            player.top = 1;
            break;

        case "s":
        case "ArrowDown":
            player.dy = player.speedY;
            player.top = 0;
            break;

        case "a":
        case "ArrowLeft":
            player.dx = player.speedX;
            player.left = 1;
            break;

        case "d":
        case "ArrowRight":
            player.dx = player.speedX;
            player.left = 0;
            break; 
    }
})

window.addEventListener("keyup", (e)=>{
    switch(e.key){
        case "w":
        case "ArrowUp":
        case "s":
        case "ArrowDown":
            player.dy = 0;
            break;
        
        case "a":
        case "ArrowLeft":
        case "d":
        case "ArrowRight":
            player.dx = 0;
            break;
    }
})

//speed controls
let astSpeed = 5;
let bulletspeed = 5;
let speedFactor = 0.3;

class Bullet {
    constructor(){
        this.x = player.x + player.width + 40;
        this.y = player.y + (player.height/2);
        this.dx = bulletspeed;
        this.rad = 20;
        this.remove = false;

        //bullet image rendering
        this.factorX = 0;
        this.factorY = 0;
        this.imageWidth = bulletImg.width / 3;
        this.imageHeight = bulletImg.height / 2;
        this.imageX = 0;
        this.imageY = 0;
    }

    move(){
        this.x += this.dx;
    }

    draw(){
        //render bullet image
        ctx.drawImage(bulletImg, this.imageX, this.imageY, this.imageWidth, this.imageHeight,
             this.x-100, this.y -20, this.rad*2 * 3 , this.rad*2 * 1.5);

        if(frame % 8 == 0){
            this.imageX = this.imageWidth * this.factorX;
            this.imageY = this.imageHeight * this.factorY;

            this.factorX++;
            if(this.factorX > 2){
                this.factorX = 0;
                this.factorY++;

                if(this.factorY > 1){
                    this.factorY = 0;
                }
            }
        }
    }
}


class Asteroid {
    constructor(astFactor=0){
        this.rad = 50;
        this.x = canvas.width + 300 + astFactor;
        this.y = this.rad + Math.floor(Math.random() * (canvas.height - 2*this.rad ))
        this.dx = astSpeed;
        this.remove = false;
        this.hit = false;
        this.fillStyle = "red";

        //asteroid image rendering
        this.factorX = 0;
        this.imageX = 0;
        this.imageY = 0;
        this.image = asteroidImg;
        this.imageWidth = this.image.width / 6;
        this.imageHeight = this.image.height;
    }

    move(){
        if(startGame){
            this.x -= this.dx;
        }
    }

    draw(){
        //render asteroid image
        ctx.drawImage(this.image, this.imageX, this.imageY, this.imageWidth, this.imageHeight,
            this.x-50, this.y-45, this.rad*2 , this.rad*2);
    }

    hitBullet(){
        if(this.hit && frame % 1 == 0){
            if(this.factorX == -1){
                this.remove = true;
                return;
            }

            if(this.factorX==1){
                if(!asteroidHit.paused){
                    asteroidHit.pause();
                    asteroidHit.currentTime = 0;
                }
                asteroidHit.play();
            }

            this.imageX = this.imageWidth * this.factorX;

            this.factorX++;

            if(this.factorX > 6){
                this.image = kaboom;
                this.imageX = 0
                this.factorX = -1;
            }
        }
    }

    hitPlayer(){
        if( this.x - this.rad < player.x + player.width  && 
            this.x + this.rad > player.x &&
            this.y - this.rad < player.y + player.height &&
            this.y + this.rad > player.y &&
            !this.hit)
            {
                //condition for hitting legs
                if( !(this.y + this.rad > player.y + 120 &&
                    this.x - this.rad < player.x + player.width  && 
                    this.x + this.rad > player.x + 120) )
                {
                    gameover = true;
                    this.remove = true;

                    //stop music
                    gameMusic.pause()
                    gameMusic.currentTime = 0;

                    crash.currentTime = 0;
                    crash.play()
                }
            } 
    }
}

class Game {
    constructor(){
        this.bullets = [];
        this.asteroids = [];

        //player image rendering
        this.factorX = 0;
        this.factorY = 0;
        this.imageWidth = jetpackman.width / 5;
        this.imageHeight = jetpackman.height / 3;
        this.imageX = 0;
        this.imageY = 0;

        //game over background
        this.overX = 0;
        this.overY = 0;
        this.overWidth = gameoverImg.width / 4;
        this.overHeight = gameoverImg.height / 4;
        this.overimageX = 0;
        this.overimageY = 0;

        //background variables
        this.backX1 = 0;
        this.backX2 = canvas.width;
        this.backX3 = 2 * canvas.width;
        this.backSpeed = 5;
        this.instructions = true;
        this.backgroundCorrection = 1;

        this.blast = true;
        window.addEventListener("keydown", (e)=>{
            if(this.overY == 3){
                this.overY = 0;
                restart = true;
            }
            if(gameover || !startGame){
                return;
            }
            //for pressing spacebar
            if(this.blast && e.key == " "){
                this.bullets.push(new Bullet())
                this.blast = false;
                gunshot.volume = 0.5;
                if(!gunshot.paused){
                    gunshot.pause();
                    gunshot.currentTime = 0;
                }
                gunshot.play();
            }
        })
    }

    run(){
        if(gameover){
            player.dx = 0;
            player.dy = 0;
        }        

        //background
        ctx.drawImage(background, this.backX1, 0, canvas.width, canvas.height);
        ctx.drawImage(background2, this.backX2, 0, canvas.width, canvas.height);
        ctx.drawImage(background3, this.backX3, 0, canvas.width, canvas.height);

        //move background
        if(!gameover){
            this.backX1 -= this.backSpeed;
            this.backX2 -= this.backSpeed;
            this.backX3 -= this.backSpeed;
        }

        if(this.backX1 + canvas.width < 0){
            this.backX1 = 2 * canvas.width - this.backgroundCorrection;
            this.backgroundCorrection++;
        }
        if(this.backX2 + canvas.width < 0){
            this.backX2 = 2 * canvas.width - this.backgroundCorrection;
            this.backgroundCorrection++;
        }
        if(this.backX3 + canvas.width < 0){
            this.backX3 = 2 * canvas.width - this.backgroundCorrection;
            this.backgroundCorrection++;
        }
        

        //move player
        if(player.x >0 && player.left){
            player.x -= player.dx;            
        }
        if(player.x + player.width < canvas.width && !player.left){
            player.x += player.dx;
        }
        if(player.y >0 && player.top){
            player.y -= player.dy;
        }
        if(player.y + player.height < canvas.height && !player.top){
            player.y += player.dy;
        }

        //add asteroids 
        if(this.asteroids.length < 1){
            this.asteroids.push(new Asteroid(canvas.width/2));
        }

        //run asteroids
        this.asteroids.forEach((asteroid, i)=>{
            if(!gameover){
                asteroid.move()
            }
            asteroid.draw()
            asteroid.hitPlayer()
            asteroid.hitBullet()

            //remove asteroids
            if(asteroid.x < -300 || asteroid.remove){
                this.asteroids.splice(i, 1);
                this.asteroids.push(new Asteroid());
                score++;
            }
        })

        //run bullets
        this.bullets.forEach((bullet, i)=>{
            bullet.move()
            bullet.draw()

            //removing overflowed or hit bullets
            if(bullet.x > canvas.width + 10){
                this.bullets.splice(i, 1);
            }

            //checking asteroid hit
            this.asteroids.forEach((asteroid, j)=>{
                let distance = Math.sqrt((bullet.x - asteroid.x)**2 + (bullet.y - asteroid.y)**2);
                if(distance < asteroid.rad + bullet.rad){
                    asteroid.hit = true;
                    this.bullets.splice(i, 1);
                }
            })
        })

        //keeping distance btn bullets
        if(frame % 100 == 0 || !this.asteroids.length){
            this.blast = true;
        }

        //speeding up game
        if(frame % 400 == 0){
            astSpeed += speedFactor;
            bulletspeed += speedFactor;
            player.speedX += speedFactor/2;
            player.speedY += speedFactor/2;
        }

        //bullet logo
        if(this.blast){
            ctx.drawImage(bulletLogo, canvas.width - 220, 10, bulletLogo.width/3, bulletLogo.height/3)
        }
        ctx.font = "bold 30px sans-serif";
        ctx.fillText("Your Score: ", canvas.width - 180, 30)
        ctx.font = "bold 40px sans-serif";
        ctx.fillText(score, canvas.width - 160, 70)


        //creating player
        ctx.drawImage(jetpackman, this.imageX, this.imageY, this.imageWidth, this.imageHeight, 
            player.x-100, player.y-10, player.width * 3.8, player.height * 1.2);

        if(frame % 6 == 0){
            this.imageX = this.imageWidth * this.factorX;
            this.imageY = this.imageHeight * this.factorY;

            this.factorX++;
            if(this.factorX > 4){
                this.factorX = 0;
                this.factorY++;

                if(this.factorY > 2){
                    this.factorY = 0;
                }
            }
        }

        //run game music
        if(!gameover && !crash.paused){
            crash.pause()
            crash.currentTime = 0;
        }
        if(!gameover && gameMusic.paused && startGame){
            gameMusic.play();
        }

        if(gameover){
            if(frame % 4 == 0){
                this.overimageX = this.overWidth * this.overX;
                this.overimageY = this.overHeight * this.overY;
    
                this.overX++;
                if(this.overX > 3){
                    this.overX = 0;

                    if(this.overY != 3){
                        this.overY++;
                    } 
                }
            }

            ctx.drawImage(gameoverImg, this.overimageX, this.overimageY, this.overWidth, this.overHeight, 
                0, 0, canvas.width, canvas.height);   
            

            if(this.overY == 3){
                ctx.fillStyle = "white";
                ctx.font = "50px sans-serif";
                ctx.fillText("Game Over ", 100, 100);
                ctx.fillText("Score:  " + score, 100, 200);
                ctx.fillText("Press any key to play again ", 100, 300);
            }
        }
        if(this.instructions && startGame){
            ctx.fillStyle = "darkslategray";
            ctx.font = "50px sans-serif";
            ctx.fillText("Hit as many asteroids as you can", 140, canvas.height - 100);
        }
        
        if(this.instructions && frame > 200){
            this.instructions = false;
        }

        //start the game
        if(!startGame){
            ctx.fillStyle = "darkslategray";
            ctx.font = "60px sans-serif";
            ctx.fillText("Press any key to start", canvas.width/3.5, canvas.height/3);
        }
    }
}

function start(){
    ctx.clearRect(0,0,canvas.width, canvas.height);
    if(restart){
        game = new Game();
        restart = false;
        gameover = false;
        frame = 0;
        score = 0;
        player = Object.assign(player, playerTemplate);
        astSpeed = 5;
        bulletspeed = 5;
        speedFactor = 0.3;
        startGame = false;
    }
    game.run();
    frame++;
    if(frame > 90000){
        frame = 0;
    }
    requestAnimationFrame(start);
}

var game = new Game();
start();


