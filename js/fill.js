//Draw data
var visible_canvas_elem;
var visible_ctx;
var offscreen_visible_canvas_elem;
var offscreen_ctx;
var board_rotation;
var board_opacity;
var border_color;
var half_board_height;
var half_board_width;
var sx, sy, sw, sh, dx, dy, dw, dh; //for image copying
const SQUARE_SIZE = 30; //should be a multiple of 10 to ensure even # of px on sides of board
const BORDER_WIDTH = 10;
const LIGHT_THEME_BG = '#ffffff';
const DARK_THEME_BG = '#424242';

//Game data
var level_num;
var max_level;
var cur_level;
var cached_level;
var player;
var can_move;
var can_reset;

//Called when the page is loaded
function init()
{
    //Load music
    backgroundMusic = new Audio('sound/backgroundLoop.mp3')
    backgroundMusic.loop = true;
    
	//Set theme
	var current_theme = getTheme();
	if(current_theme == 'Light')
	{
		setLightTheme();
	}
	else
	{
		setDarkTheme();
	}
	
	//Set up boards
	visible_canvas_elem = document.getElementById('gameboard');
	visible_ctx = visible_canvas_elem.getContext('2d');
	offscreen_visible_canvas_elem = document.getElementById('offscreen_canvas'); //optimize animations by copying to offscreen canvas
	offscreen_ctx = offscreen_visible_canvas_elem.getContext('2d');
	
	//Set up player
	player = new Player(0, 0); //this gets overwritten in reset()
	
	//Read last completed level
	level_num = getLastLevelAccessed();
	
	//Read max level
	max_level = getMaxLevelAccessed();
	if(max_level < level_num)
	{
		max_level = level_num;
		setMaxLevelAccessed(max_level);
	}
	
	//Clear cache
	cached_level = 0;
	
	//Set up font
	visible_ctx.textAlign = 'center';
	visible_ctx.textBaseline = 'middle';
	visible_ctx.font = '24px monospace';
	
	//Add level counter
	updateLevelCounter();
	
	//Go!
	resetAndRedraw();
}

//-----CONVENIENCE FUNCTIONS-----//
function updateLevelCounter()
{
	if(level_num < levels.length)
	{
		document.getElementById('levelcounter').innerHTML = "Tutorial " + (level_num+1);
	}
	else
	{
		document.getElementById('levelcounter').innerHTML = (level_num+1);
	}
}

//-----STORAGE FUNCTIONS-----//

//Read last level accessed from local storage
function getLastLevelAccessed()
{
	var local_storage = window.localStorage;
	var last_access = local_storage.getItem("lastLevelAccessed");
	if(last_access == null) return 0;
	else return parseInt(last_access);
}

//Set last level accessed in local storage
function setLastLevelAccessed(value)
{
	var local_storage = window.localStorage;
	local_storage.setItem("lastLevelAccessed", ""+value);
}

//Read max level accessed from local storage
function getMaxLevelAccessed()
{
	var local_storage = window.localStorage;
	var max_access = local_storage.getItem("maxLevelAccessed");
	if(max_access == null) return 0;
	else return parseInt(max_access);
}

//Set max level accessed in local storage
function setMaxLevelAccessed(value)
{
	var local_storage = window.localStorage;
	local_storage.setItem("maxLevelAccessed", ""+value);
}

function getTheme()
{
	var local_storage = window.localStorage;
	var theme = local_storage.getItem("theme");
	if(theme == null) return "Light";
	else return theme;
}

function setTheme(value)
{
	var local_storage = window.localStorage;
	local_storage.setItem("theme", value);
}

//-----END CONDITIONS-----//

//Resets the board and redraws it (fades in)
function resetAndRedraw()
{	
	//Reset board
	if(cached_level === 0)
	{
		if(level_num < levels.length)
		{
			cached_level = levels[level_num];
		}
		else
		{
			cached_level = generateLevel('seed' + level_num);
		}
	}
	cur_level = JSON.parse(JSON.stringify(cached_level)); //Deep copy cached level
	board_rotation = 0;
	board_opacity = 1; //opaque
	border_color = '#000000';
	half_board_width = (cur_level.width*SQUARE_SIZE + 2*BORDER_WIDTH) / 2;
	half_board_height = (cur_level.height*SQUARE_SIZE + 2*BORDER_WIDTH) / 2;
	sx = dx = offscreen_visible_canvas_elem.width/2 - half_board_width;
	sy = dy = offscreen_visible_canvas_elem.height/2 - half_board_height;
	sw = dw = half_board_width*2;
	sh = dh = half_board_height*2;
	
	//Reset player
	player.row = cur_level.start_pos.row;
	player.col = cur_level.start_pos.col;
	player.squares_visited = 1;
	
	//Redraw, buffering into offscreen canvas
	offscreen_ctx.clearRect(0, 0, offscreen_visible_canvas_elem.width, offscreen_visible_canvas_elem.height);
	draw(offscreen_ctx);
	animateReset();
	
	//Final touches
	can_reset = true;
	can_move = true;
}

//Check if we're on the finish square.  If so, check if all squares were visited.  Also redraws the board accordingly
function checkWinAndRedraw()
{
	if(player.row == cur_level.finish_pos.row && player.col == cur_level.finish_pos.col) //on finish square
	{
		can_move = false;
		
		if(player.squares_visited == cur_level.num_spaces)
		{
			//Buffer into offscreen canvas
			offscreen_ctx.clearRect(0, 0, offscreen_visible_canvas_elem.width, offscreen_visible_canvas_elem.height);
			draw(offscreen_ctx);
			animateWin();
		}
		else //didn't touch all spaces
		{
			border_color = '#ff0000'; //red
			draw(visible_ctx);
		}
	}
	else //not on finish square
	{
		//Check if player is stuck after making a valid move
		//Do this check here so the board doesn't turn red on a win
		if(!player.canMove())
		{
			can_move = false;
			border_color = '#ff0000';
		}
		draw(visible_ctx); //draw board as usual
	}
}

//-----DRAWING-----//

//Draw the level based on cur_level data
//Draws onto the specified board
function draw(board_ctx)
{
	//Clear canvas
	board_ctx.clearRect(0, 0, visible_canvas_elem.width, visible_canvas_elem.height);
	
	//Translate board to center of canvas
	board_ctx.save(); //save context
	var trans_x = visible_canvas_elem.width/2 - half_board_width;
	var trans_y = visible_canvas_elem.height/2 - half_board_height;
	board_ctx.translate(trans_x, trans_y);
	
	//Draw border
	board_ctx.strokeStyle = border_color;
	board_ctx.lineWidth = BORDER_WIDTH;
	board_ctx.strokeRect(BORDER_WIDTH/2, BORDER_WIDTH/2, half_board_width*2-BORDER_WIDTH, half_board_height*2-BORDER_WIDTH); //align border to corners
	
	//Draw level
	for(var r = 0; r < cur_level.height; ++r)
	{
		for(var c = 0; c < cur_level.width; ++c)
		{
			var type = cur_level.layout[r][c];
			board_ctx.fillStyle = getColor(type);
			if(type == WRAP_LEFT)
			{
				board_ctx.fillRect(c*SQUARE_SIZE, BORDER_WIDTH+r*SQUARE_SIZE, SQUARE_SIZE+BORDER_WIDTH, SQUARE_SIZE);
			}
			else if(type == WRAP_RIGHT)
			{
				board_ctx.fillRect(BORDER_WIDTH+c*SQUARE_SIZE, BORDER_WIDTH+r*SQUARE_SIZE, SQUARE_SIZE+BORDER_WIDTH, SQUARE_SIZE);
			}
			else if(type == WRAP_UP)
			{
				board_ctx.fillRect(BORDER_WIDTH+c*SQUARE_SIZE, r*SQUARE_SIZE, SQUARE_SIZE, SQUARE_SIZE+BORDER_WIDTH);
			}
			else if(type == WRAP_DOWN)
			{
				board_ctx.fillRect(BORDER_WIDTH+c*SQUARE_SIZE, BORDER_WIDTH+r*SQUARE_SIZE, SQUARE_SIZE, SQUARE_SIZE+BORDER_WIDTH);
			}
			else
			{
				board_ctx.fillRect(BORDER_WIDTH+c*SQUARE_SIZE, BORDER_WIDTH+r*SQUARE_SIZE, SQUARE_SIZE, SQUARE_SIZE);
			}
		}
	}
	
	//Draw player
	board_ctx.fillStyle = '#00ff00';
	board_ctx.fillRect(BORDER_WIDTH+player.col*SQUARE_SIZE, BORDER_WIDTH+player.row*SQUARE_SIZE, SQUARE_SIZE, SQUARE_SIZE);
	
	board_ctx.restore(); //restore context
}

//Runs the win animation, calls spinBoard
function animateWin()
{
	//Disable input
	can_move = false;
	can_reset = false;
	
	//Offscreen canvas should already hold copy of board from checkWinAndRedraw
	board_rotation = 0;
	board_opacity = 1;

	++level_num;
	
	//Update local storage
	setLastLevelAccessed(level_num);
	if(level_num > max_level) //update only if we've advanced
	{
		max_level = level_num;
		setMaxLevelAccessed(max_level);
	}
	cached_level = 0; //invalidate cache

	window.requestAnimationFrame(spinBoard)
}
function spinBoard(timestamp)
{
	board_rotation += 0.01 + 0.03*board_rotation; //speeds up as it rotates
	board_opacity -= 0.01;
	if(board_opacity < 0.03) //end animation
	{
		board_opacity = 0; //hide board
		updateLevelCounter();
		resetAndRedraw();
	}
	else //Copy board from offscreen to visible and rotate
	{
		visible_ctx.clearRect(0, 0, visible_canvas_elem.width, visible_canvas_elem.height);
		visible_ctx.save();
		
		//Rotate about center
		visible_ctx.translate(visible_canvas_elem.width/2, visible_canvas_elem.height/2);
		visible_ctx.rotate(board_rotation);
		visible_ctx.translate(-1*visible_canvas_elem.width/2, -1*visible_canvas_elem.height/2);
		
		//Set alpha
		visible_ctx.globalAlpha = board_opacity;
		
		//Draw, only copying the board and not the entire canvas
		visible_ctx.drawImage(offscreen_visible_canvas_elem, sx, sy, sw, sh, dx, dy, dw, dh);
		
		visible_ctx.restore();
		
		//Continue animation
		window.requestAnimationFrame(spinBoard);
	}
}

//Runs the reset animation by calling fadeinBoard
//Similar logic as in animateWin
function animateReset()
{
	//Setup
	can_reset = false;
	board_opacity = 0;
	//offscreen_ctx should already hold a copy of the board from resetAndRedraw
	
	//Animate
	window.requestAnimationFrame(fadeinBoard);
}
function fadeinBoard(timestamp)
{
	board_opacity += 0.05;
	if(board_opacity > 1) //end animation
	{
		board_opacity = 1;
		can_reset = true;
	}
	else
	{
		visible_ctx.save();
		visible_ctx.clearRect(0, 0, visible_canvas_elem.width, visible_canvas_elem.height);
		visible_ctx.globalAlpha = board_opacity;
		visible_ctx.drawImage(offscreen_visible_canvas_elem, sx, sy, sw, sh, dx, dy, dw, dh);
		visible_ctx.restore();
		window.requestAnimationFrame(fadeinBoard);
	}
}

//-----PLAYER-----//

//Constructor for a Player object
//Accepts a starting position
function Player(start_row, start_col)
{
	this.row = start_row;
	this.col = start_col;
	this.squares_visited = 1; //we've visited the square we start on
	this.moveTo = moveTo;
	this.canMove = canMove;
}

//Attempt to move player to specified position
//Also checks if the player is stuck
function moveTo(next_pos)
{
	var cur_square = cur_level.layout[this.row][this.col];

	//Change destination for wrapping squares
	if(cur_square == WRAP_LEFT || cur_square == WRAP_RIGHT)
	{
		next_pos.col = (next_pos.col + cur_level.width) % cur_level.width;
	}
	else if(cur_square == WRAP_UP || cur_square == WRAP_DOWN)
	{
		next_pos.row = (next_pos.row + cur_level.height) % cur_level.height;
	}
	
	//Check if valid move
	if(!isInBounds(next_pos, cur_level.height, cur_level.width))
	{
		return;
	}
	var next_square = cur_level.layout[next_pos.row][next_pos.col];
	if(next_square == WALL || next_square == VISITED || next_square == START)
	{
		return;
	}
	
	//If we make it here, it's a valid move
	if(cur_square == HOLE)
	{
		cur_level.layout[this.row][this.col] = EMPTY; //we can reuse this square if we were on a hole
		this.squares_visited--; //avoid double-counting the square
	}		
	else
	{
		cur_level.layout[this.row][this.col] = VISITED; //mark previous square as visited
		
		//Set corresponding wrapped squares to EMPTY since they can't be accessed any more
		if(cur_square == WRAP_LEFT || cur_square == WRAP_RIGHT)
		{
			cur_level.layout[this.row][-1*this.col + cur_level.width - 1] = EMPTY;
		}
		else if(cur_square == WRAP_UP || cur_square == WRAP_DOWN)
		{
			cur_level.layout[-1*this.row + cur_level.height - 1][this.col] = EMPTY;
		}
	}
	
	//Move player
	this.row = next_pos.row;
	this.col = next_pos.col;
	this.squares_visited++; //update number of squares visited
}

//Returns true if the player has available moves left
function canMove()
{
	//If we're on a wrap square, we must at least be able to move to its partner
	if(isWrapSquare(cur_level.layout[this.row][this.col]))
	{
		return true;
	}
	
	//If we're not on a wrap square, only check immediate neighbors (don't do any wrapping)
	if(isInBounds({row:this.row + 1, col:this.col}, cur_level.height, cur_level.width) && isOpenSquare(cur_level.layout[this.row + 1][this.col])) return true;
	if(isInBounds({row:this.row - 1, col:this.col}, cur_level.height, cur_level.width) && isOpenSquare(cur_level.layout[this.row - 1][this.col])) return true;
	if(isInBounds({row:this.row, col:this.col + 1}, cur_level.height, cur_level.width) && isOpenSquare(cur_level.layout[this.row][this.col + 1])) return true;
	if(isInBounds({row:this.row, col:this.col - 1}, cur_level.height, cur_level.width) && isOpenSquare(cur_level.layout[this.row][this.col - 1])) return true;
	
	return false;
	
}

//Keyboard input
document.addEventListener('keypress', function(event){
    switch(event.key)
    {
        case 'r':
            if(can_reset) resetAndRedraw();
            break;
        case 'w':
            if(!can_move) return;
            player.moveTo({row:player.row-1, col:player.col});
            checkWinAndRedraw();
            break;
        case 's':
            if(!can_move) return;
            player.moveTo({row:player.row+1, col:player.col});
            checkWinAndRedraw();
            break;
        case 'a':
            if(!can_move) return;
            player.moveTo({row:player.row, col:player.col-1});
            checkWinAndRedraw();
            break;
        case 'd':
            if(!can_move) return;
            player.moveTo({row:player.row, col:player.col+1});
            checkWinAndRedraw();
            break;
        case 't':
            toggleTheme();
            break;
        case 'm':
            if(backgroundMusic.paused)
            {
                backgroundMusic.play();
            }
            else
            {
                backgroundMusic.pause();
            }
            break;
        case 'z':
            gotoPrevLevel();
            break;
        case 'x':
            gotoNextLevel();
            break;
    }
});

function gotoPrevLevel()
{
	//Check if we should be allowed to change levels
	if(!can_reset || level_num == 0) return;
	
	//Move to prev level
	--level_num;
	setLastLevelAccessed(level_num);
	
	//Invalidate cache and reset
	cached_level = 0;
	can_move = false;
	updateLevelCounter();
	resetAndRedraw();
}

function gotoNextLevel()
{
	//Check if we should be allowed to change levels
	if(!can_reset || level_num == max_level) return;
	
	//Move to next level
	++level_num;
	setLastLevelAccessed(level_num);
	
	//Invalidate cache and reset
	cached_level = 0;
	can_move = false;
	updateLevelCounter();
	resetAndRedraw();
}

function toggleTheme()
{
	var current_theme = getTheme();
	if(current_theme == 'Light')
	{
		setDarkTheme();
	}
	else
	{
		setLightTheme();
	}
}

function setLightTheme()
{
	setTheme('Light');
	document.body.style.backgroundColor = LIGHT_THEME_BG;
}

function setDarkTheme()
{
	setTheme('Dark');
	document.body.style.backgroundColor = DARK_THEME_BG;
}