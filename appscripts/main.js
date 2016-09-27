// Lim Chuan Yong, Alden (A0118870B)

// Music by Kevin Macleod of incompetech.com, licensed under Creative Commons 3.0
// SFX by various users from freesound.org, licensed under Creative Commons 3.0

require(
   // Use this library to "fix" some annoying things about Raphel paper and graphical elements:
    //     a) paper.put(relement) - to put an Element created by paper back on a paper after it has been removed
    //     b) call element.addEventListener(...) instead of element.node.addEventListner(...)
    ["../jslibs/raphael.lonce"],  // include a custom-built library

    function () {

        console.log("Yo, I am alive!");
        
        // Grab the div where we will put our Raphael paper
        var centerDiv = document.getElementById("centerDiv");

        // Create the Raphael paper that we will use for drawing and creating graphical objects
        var paper = new Raphael(centerDiv);

        // put the width and heigth of the canvas into variables for our own convenience
        var pWidth = 1000;
        var pHeight = 400;
        console.log("pWidth is " + pWidth + ", and pHeight is " + pHeight);





        /*---------------------------------------------------------------------/
        /----------------------------------------------------------------------/
        /                    GAME VARIABLES & CONTROLS                         /
        /----------------------------------------------------------------------/
        /---------------------------------------------------------------------*/
        var gameState = 0;          // 0 = idle; 1 = running;

        var bulletColor = "red";    // default = red; game uses red, dodgerblue and yellow
        var bulletColorId = 1;      // default = 1; 1 = red, 2 = dodgerblueblue, 3 = yellow; this variable is for collision detection purposes
        var bullet = [];            // bullet array
        var bulletCount = 0;        // bullet counter for array usage

        var enemy = [];             // enemy array
        var enemyCount = 0;         // enemy counter for array usage
        var enemyColorId = 0;       // default = 0; 1 = red, 2 = dodgerblue, 3 = yellow, 4 = purple, 5 = green, 6 = orange; default value does not affect spawnController function as it recalculates the value once called; this variable is for collision detection purposes
        var enemyRange = 3;         // default = 3; determines color range of enemeies; 3 = red blue yellow; 4 = +purple; 5 = +green; 6 = +orange;
        var spawnDir = 0;           // default = 0; 0 = left, 1 = right; this alternates in spawn func.
        var interval = 2000;        // default = 2000ms; used to determine rate of enemy spawn

        var gravity = 0.2;          // gravity factor
        var count = 0;              // draw count variable (for debug purposes)
        var score = 0;              // score variable

        // Create score text & visual feedback for player
        var ui_score = paper.text(pWidth/2,30, "Score: " + score);
        ui_score.attr({"fill": "white", "font-size": 50});

        // Create the 'player' entity in the bottom center of the paper
        var player = paper.circle(pWidth/2, pHeight, 30);
        player.attr({"fill": bulletColor, "stroke-width": 0});
        player.xpos = pWidth/2;     // intialize xpos value of player for collision detection purposes
        player.ypos = pHeight;      // intialize ypos value of player for collision detection purposes

        // Keydown event listener to change color of balls
        document.addEventListener("keydown", function(ev){
            if(ev.keyCode == 49){       // 49 == standard '1' key (not keypad '1')
                bulletColor = "red";
                bulletColorId = 1;      // 1 = red, 2 = dodgerblueblue, 3 = yellow;
                player.attr({"fill": bulletColor});
                centerDiv.style.backgroundColor = "#4d0000";
            }
            if (ev.keyCode == 50){      // 50 == standard '2' key (not keypad '2')
                bulletColor = "dodgerblue";
                bulletColorId = 2;      // 1 = red, 2 = dodgerblueblue, 3 = yellow;
                player.attr({"fill": bulletColor});
                centerDiv.style.backgroundColor = "#000066";
            }
            if (ev.keyCode == 51){      // 51 == standard '3' key (not keypad '3')
                bulletColor = "yellow";
                bulletColorId = 3;      // 1 = red, 2 = dodgerblueblue, 3 = yellow;
                player.attr({"fill": bulletColor});
                centerDiv.style.backgroundColor = "#665600";
            }
            //if (ev.keyCode == 52){      // 52 == standard '4' key (not keypad '4'); FOR DEBUGGING PURPOSES
            //    spawnController(enemyCount);
            //    enemyCount++;
            //}
        });

        // Mousedown event listener to fire bullets
        centerDiv.addEventListener("mousedown", function(ev){
            //console.log("mouseclicked")
            if (gameState){                 // if game is running then create bullet entity
                fire(ev,bulletCount,bulletColorId);       // calls the fire function passing in the mouse event and current bulletcount
                if(bulletCount == 99){      // if statement to reset bulletcount to 0 to prevent array from growing too large in longlasting games
                    bulletCount = 0;
                } else {
                    bulletCount++;          // increase bulletcount by 1 if cap is not reached
                }
            }
        });

        /*---------------------------------------------------------------------/
        /----------------------------------------------------------------------/
        /                  GAME INITIALIZERS & USER INTERFACE                  /
        /----------------------------------------------------------------------/
        /---------------------------------------------------------------------*/

        // intialize audios 
        var audioFire = []; // define new array for audio; allows simulatenous playing of the same sound
        var audioHit = [];  // define new array for audio; allows simulatenous playing of the same sound
        var audioLevelup = new Audio("resources/levelup.mp3");
        var audioLevelup2 = new Audio("resources/levelup2.mp3");
        var bgm = new Audio("resources/music.mp3");
        bgm.loop = true;    // allops music to loop

        // Start button with text on top
        var startButton = paper.circle(pWidth/2, pHeight/2, 50);
        var startText = paper.text(pWidth/2, pHeight/2, 'START');
        var gameTitle = paper.text(pWidth/2, 30, "PAINTBALL MASTER CHALLENGE");

        startButton.attr({
            'stroke': "black",
            'stroke-width': 5,
            'fill': "#BCC1F2",

        });
        startText.attr({
            'font-size': 18, 'font-weight': 800
        });
        gameTitle.attr({
            'font-size': 50, 'font-weight': 800, 'fill': 'white'
        });

        // Hide for now, show it only when we are ready
        startButton.hide();
        startText.hide();
        gameTitle.hide();

        // ready game state; resets important variables to default values & shows ui buttons
        var ready = function(){
            gameState = 0;                              // set game state to 0 = idle; prevents bullets from firing
            startButton.show();                         // show main menu ui
            startText.show();                           // show main menu ui
            gameTitle.show();                           // show main menu ui
            player.hide();                              // hides player
            ui_score.hide();                            // hides score text
            interval = 2000;                            // reset interval value of enemy spawn to default; default = 2000ms
            score = 0;                                  // reset score variable
            //enemyRange = 3;
            ui_score.attr({"text": "Score: " + score}); // reset score text to 0
        };

        // displays game instructions
        var instructions = function(){
            confirm("Hello there!\n\nWelcome to the Paintball Master Challenge!\n\nThe goal of this game is get a score as high as possible without dying!\n\nShoot the paintballs by clicking anywhere on the play area. You have 3 colors to choose, press '1' on your keyboard for Red, '2' for Blue & '3' for Yellow. Colored blocks can only be destroyed by the corresponding color and when blocks touch you, the game ends!\n\nBlock spawn 10% faster for every 10 success and a new composite color block (up to 3; purple, green & orange) will spawn for every 30 success. A sound effect will play upon difficulty increase.");
            start();
        };

        // begins the game
        var start = function(){
            console.log("game starting");
            gameState = 1;          // set game state to 1 = running to allow bullets to fire
            startButton.hide();     // hides main menu ui
            startText.hide();       // hides main menu ui
            gameTitle.hide();       // hides main menu ui
            player.show();          // show the player
            ui_score.show();        // show the score ui
            bgm.play();             // play music
            spawn();                // start the spawn function
        };

        var end = function(){
            confirm("GAME OVER! \n You have a grand total of " + score + " correct paintball successes!");      // show end game prompt with score
            for (i = 0; i < enemyCount; i++){       // loop to remove all existing enemies
                clearInterval(enemy[i].interval);   // clear enemy[i] movement interval
                clearInterval(enemy[i].collider);   // clear enemy[i] collision detection interval
                enemy[i].remove();                  // removes the enemy from the screen
            }  
            clearInterval(spawnInterval);           // clear the spawn interval to prevent more enemies from spawning
            bgm.pause();                            // stop the music
            bgm.currentTime = 0;                    // reset music elapsed duration to 0
            ready();                                // set game to idle mode
        };

        // Upon clicking START, load instructions prompt
        startButton.node.addEventListener('click', instructions);
        startText.node.addEventListener('click', instructions);     // To solve inconsistency when clicking on text not causing the game to start

        // Change of colour for start button when player's mouse is hovering over the start button. Serves as a visual feedback.
        startButton.node.addEventListener('mouseover', function(ev){
            startButton.attr({
                'fill': "#DB5844"
            })
        });

        startButton.node.addEventListener('mouseout', function(ev){
            startButton.attr({
                'fill': "#BCC1F2"
            })
        });

        startText.node.addEventListener('mouseover', function(ev){      // To solve inconsistency when hovering over text causing the button to be not in hover state
            startButton.attr({
                'fill': "#DB5844"
            })
        });

        startText.node.addEventListener('mouseout', function(ev){      // To solve inconsistency when hovering over text causing the button to be not in hover state
            startButton.attr({
                'fill': "#BCC1F2"
            })
        });






        /*---------------------------------------------------------------------/
        /----------------------------------------------------------------------/
        /                         GAME CORE FUNCTIONS                          /
        /----------------------------------------------------------------------/
        /---------------------------------------------------------------------*/

        // bullets creation function, taking in arguments 'e' for event and 'i' for array value
        var fire = function(e,i,d){

            console.log("triggered")

            bullet[i] = paper.circle(pWidth/2, pHeight, 5);             // create bullets from player position
            bullet[i].attr({"fill": bulletColor, "stroke-width": 0})    // color bullets based on current selected color
            bullet[i].colorId = d;                                      // specific bullets's color id for collision detection purposes

            bullet[i].xpos = pWidth/2;                                  // xpos value for draw function
            bullet[i].ypos = pHeight;                                   // ypos value for draw function

            bullet[i].xrate = (e.offsetX - pWidth/2)/70;                // xrate value for draw function; calculated based on event x; the further away the event was from player, the faster it moves on the x-axis but not linear (divided by a default factor of 70)
            bullet[i].yrate = (e.offsetY - pWidth/2)/30;                // yrate value for draw function; calculated based on event y; the further away the event was from player, the faster it moves on the y-axis but not linear (divided by a default factor of 30)

            bullet[i].interval = setInterval(function(){draw(i);},20);          // create individual interval for bullets movement, passing current array no.
            bullet[i].collider = setInterval(function(){collider2(i);},1);     // create individual interval for collision detection, passing current array no.

            console.log("Bullet " + i + " created.");
            audioFire[i] = new Audio("resources/fire.mp3");             // allows simulatenous playing of the same sound
            audioHit[i] = new Audio("resources/hit.mp3");               // allows simulatenous playing of the same sound
            audioFire[i].play();
        };

        // draw function to update bullet[i] position based on its xrate & yrate; also applies gravity factor to make bullets fall down; takes argument 'n' for array value
        var draw = function(n){

            //count++;
            //console.log("draw count:" + count);
            //console.log(n);

            bullet[n].xpos += bullet[n].xrate;      // calculate next xpos of bullet[i]
            bullet[n].ypos += bullet[n].yrate;      // calculate next ypos of bullet[i]
            //console.log("Bullet No.:" + n + ", xpos" + bullet[n].xpos + ", ypos" + bullet[n].ypos) 

            bullet[n].attr({'cx': bullet[n].xpos, 'cy': bullet[n].ypos});   // update new bullet[i] position based on calculated xpos ypos

            bullet[n].yrate = bullet[n].yrate + gravity;    // update bullet[i] yrate to create gravity effect

            // destory bullet if bullet falls below ground
            if (bullet[n].ypos > pHeight + 20){
                clearInterval(bullet[n].interval);  // removes draw interval
                clearInterval(bullet[n].collider);  // removes collision interval
                bullet[n].remove();                 // removes the bullet raphael entity
            }
        };

        // collision detection function to detect when bullet hits enemy & destory self; takes argument 'n' for array value
        var collider2 = function(n){

            for (i = 0; i < enemyCount; i++){
                    if (bullet[n].xpos <= enemy[i].xpos + 10 && bullet[n].xpos >= enemy[i].xpos && bullet[n].ypos <= enemy[i].ypos + 50 && bullet[n].ypos >= enemy[i].ypos){    // this detects if the bullet is within the dimensions of the enemy

                        if (bullet[n].colorId == enemy[i].colorId){     // detect if bullet is same color as enemy, if true...
                            score++;                                    // increment score by 1
                            ui_score.attr({"text": "Score: " + score}); // update visual text score
                            clearInterval(enemy[i].interval);           // removes the collided enemy movement inverval
                            enemy[i].remove();                          // removes the enemy raphael entity
                        }

                        if (enemy[i].colorId < 7 && enemy[i].colorId > 3){    // if enemy is composite color (purple,green,orange)
                            switch(enemy[i].colorId){
                                case 4:                                       // if enemy[i].colorId === 4 (purple)
                                    if (bullet[n].colorId === 1){             // if collided bullet colorId === 1 (red), subtract red from purple = blue
                                    enemy[i].colorId = 2;                     // set enemy[i].colorId = 2 (blue)
                                    enemy[i].attr({"fill": "dodgerblue"});     
                                    break;                                   
                                    } else if (bullet[n].colorId === 2){      // if collided bullet colorId === 1 (blue), subtract blue from purple = red
                                        enemy[i].colorId = 1;                 // set enemy[i].colorId = 1 (red)
                                        enemy[i].attr({"fill": "red"});
                                        break;
                                    } else {
                                        break;
                                    }
                                case 5:                                       // if enemy[i].colorId === 5 (green)
                                    if (bullet[n].colorId === 2){             // if collided bullet colorId === 2 (blue), subtract blue from green = yellow
                                    enemy[i].colorId = 3;                     // set enemy[i].colorId = 3 (yellow)
                                    enemy[i].attr({"fill": "yellow"});     
                                    break;                                   
                                    } else if (bullet[n].colorId === 3){      // if collided bullet colorId === 3 (yellow), subtract yellow from green = blue
                                        enemy[i].colorId = 2;                 // set enemy[i].colorId = 2 (blue)
                                        enemy[i].attr({"fill": "dodgerblue"});
                                        break;
                                    } else {
                                        break;
                                    }
                                case 6:                                        // if enemy[i].colorId === 6 (orange)
                                    if (bullet[n].colorId === 1){              // if collided bullet colorId === 1 (red), subtract red from orange = yellow
                                    enemy[i].colorId = 3;                      // set enemy[i].colorId = 3 (yellow)
                                    enemy[i].attr({"fill": "yellow"});     
                                    break;                                   
                                    } else if (bullet[n].colorId === 3){       // if collided bullet colorId === 3 (yellow), subtract yellow from orange = red
                                        enemy[i].colorId = 1;                  // set enemy[i].colorId = 1 (red)
                                        enemy[i].attr({"fill": "red"});
                                        break;
                                    } else {
                                        break;
                                    }
                            }
                        }

                        // if bullet is not same color as enemy, the bullet will still be destroyed while the enemy continues moving
                        console.log("collision bulletId (" + bullet[n].colorId + "), enemyId = " + enemy[i].colorId);
                        clearInterval(bullet[n].interval);              // removes bullet draw interval
                        clearInterval(bullet[n].collider);              // removes collision interval
                        bullet[n].remove();                             // removes the bullet raphael entity
                        audioHit[n].play();                             // play audio feedback

                        // difficulty increment
                        if (score%10 == 0 && score != 0 && score%30 != 0){      // for every score increase of 10; score != 0 is to prevent cases where the sound plays when no blocks are destroyed yet
                            clearInterval(spawnInterval);                       // clears the existing spawn interval
                            interval *= 0.9;                                    // speed up spawn rate by a factor of 10% (interval * 0.9)
                            spawn();                                            // starts new spawn based on updated interval rate
                            audioLevelup.play();                                // plays audio feedback to notify players of difficulty increase
                        }

                        if (score%30 == 0 && score != 0 && enemyRange != 6){    // for every score increase of 20; score != 0 is to prevent cases where the sound plays when no blocks are destroyed yet
                            enemyRange++;                                       // increase range of spawnable enemy colors
                            audioLevelup2.play();                               // plays audio feedback to notify players of additional multi-colored block
                        }

                        break;                                          // break out of loop to prevent function from starting a never-ending loop (bug)
                    }
            }
        }

        // spawn contoller function that creates enemy entities; takes argument 'n' for array value
        var spawnController = function(n){

            // if else statement to alternate direction of enemy
            if (spawnDir){                                          // if true (spawnDir = 1)
                enemy[n] = paper.rect(pWidth,pHeight-50,10,50);     // create enemy[n] entity
                enemy[n].xrate = -1;                                // initialize xrate value for moveEnemy function (-ve value means it moves to the left)
                enemy[n].xpos = pWidth;                             // initialize xpos value for moveEnemy function
                spawnDir = 0;                                       // set spawnDir to 0
            } else {                                                // false (spawnDir = 0)
                enemy[n] = paper.rect(-10,pHeight-50,10,50);        // create enemy[n] entity
                enemy[n].xrate = 1;                                 // initialize xrate value for moveEnemy function (+ve value means it moves to the right)
                enemy[n].xpos = -10;                                // initialize xpos value for moveEnemy function
                spawnDir = 1;                                       // set spawnDir to 1
            }

            enemy[n].ypos = pHeight-50;                                       // enemy does not move on the y-axis however this value is required for collision detection purposes
            enemy[n].colorId = Math.floor((Math.random() * enemyRange) + 1);  // determine the color of the enemy created based on enemyRange value (default is 1 ~ 3)
            //enemy[n].colorId = 6;
            var color = enemyColor(enemy[n].colorId);                         // return the string value of the color based on colorId using the enemyColor function
            console.log(color + " block produced of colorId " + enemy[n].colorId);      
            enemy[n].attr({"fill": color, "stroke-width": 0});                // color the enemy[n] entity based on returned color string
            enemy[n].interval = setInterval(function(){moveEnemy(n);},20);    // create individual interval for enemy movement, passing current array no.
            enemy[n].collider = setInterval(function(){collider3(n);},20);       // create individual interval for enemy collision with player, passing current array no.
        };

        // enemy movement function (similar to draw function); takes argument 'n' for array value
        var moveEnemy = function(n){
            enemy[n].xpos += enemy[n].xrate;        // calculate next xpos of enemy[n]
            enemy[n].attr({'x': enemy[n].xpos});    // update new enemy[n] position based on calculated xpos
        };

        // color string return function; takes argument 'range' for switch case
        var enemyColor = function(range){
            switch(range){
                case 1:                     // if range = 1, return 'red' string
                    return "red";
                case 2:                     // if range = 2, return 'dodgerblue' string
                    return "dodgerblue";
                case 3:                     // if range = 3, return 'yellow' string
                    return "yellow";
                case 4:                     // if range = 4, return 'purple' string
                    return "mediumpurple";
                case 5:                     // if range = 5, return 'green' string
                    return "lawngreen";
                case 6:                     // if range = 6, return 'orange' string
                    return "darkorange";
            }
        };

        // collision detection function for enemy & player; if enemy touches player, game is over; takes argument 'n' for array value
        var collider3 = function (n){
            if (enemy[n].xpos >= player.xpos-38 && enemy[n].xpos <= player.xpos+30){    // this detects if enemy[n] is within the dimensions of player entity
                clearInterval(enemy[n].interval);                                       // removes the collided enemy movement inverval
                enemy[n].remove();                                                      // removes the enemy raphael entity
                end();                                                                  // calls the end game function
            }
        };

        // game controller setInterval to periodically spawn enemies
        var spawn = function(){
            console.log("spawning at a rate of " + interval + "ms");
            spawnInterval = setInterval(function(){
                spawnController(enemyCount);    // calls the spawnContoller function, passing the value of enemyCount
                enemyCount++;                   // increment enemyCount by 1 if cap not reached
            },interval);                        // every interval.ms call the spawnController function (default = 2000ms)
        }

        // set game state to idle upon loading of js
        ready();
});