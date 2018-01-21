//Draw data
var canvas_elem;
var board_ctx;
var board_rotation;
var board_opacity;
var border_color;
const SQUARE_SIZE = 30;

//Game data
var level_num;
var cur_level;
var player;
var can_move;
var can_reset;
var is_level_select;

//Called when the page is loaded
function init()
{
	//Set up board
	canvas_elem = document.getElementById('gameboard');
	board_ctx = canvas_elem.getContext('2d');
	level_num = 0;
	player = new Player(0, 0); //this gets overwritten in reset()
	is_level_select = false;
	
	//Set up level selection
	var levelselect_width = 6;
	var levelselect_height = Math.ceil((levels.length+3)/levelselect_width); //add 3 for start, finsh, and levelselect level
	var levelselect_layout = [];
	//Fill with walls
	for(var r = 0; r < levelselect_height; ++r)
	{
		levelselect_layout.push([]); //push row
		for(var c = 0; c < levelselect_width; ++c)
		{
			levelselect_layout[r].push(WALL);
		}
	}
	//Fill in start, first level, and end squares
	addToLevel(levelselect_width, levelselect_layout, 0, START);
	addToLevel(levelselect_width, levelselect_layout, 1, -1);
	var finish = mapIndexToSnake(levels.length+2, levelselect_width); //plus 2 for levelselect level
	addToLevel(levelselect_width, levelselect_layout, finish, FINISH);
	var levelselect_l = new Level(levelselect_width, levelselect_height, levelselect_layout);
	//Push to levels array
	levels.push(levelselect_l);
	
	//Set up font
	board_ctx.textAlign = 'center';
	board_ctx.textBaseline = 'middle';
	board_ctx.font = '24px monospace';
	
	//Add level counter
	document.getElementById('levelcounter').innerHTML = (level_num+1) + ' / ' + levels.length;
	
	//Go!
	resetAndRedraw();
}

//-----CONVENIENCE FUNCTIONS-----//

/*
Map positions from this:
0 1 2 3 4 5 6 7 8 9...

...to this...

0 1 2 3 7 6 5 4 8 9...

which makes a snake:

0 1 2 3
7 6 5 4
8 9...
*/
function mapIndexToSnake(position, width)
{
	var row = Math.floor(position/width);
	if(row % 2 == 0)
	{
		return position;
	}
	else
	{
		return 3*width*row - 1 - position;
	}
}

//Map player pos to level on level select screen
function mapPlayerToLevel(p_row, p_col, width)
{
	var position = p_row*width + p_col;
	return mapIndexToSnake(position, width); //same function undoes mapping
}

//Add something to the level selection screen
function addToLevel(width, layout, position, value)
{
	layout[Math.floor(position/width)][position%width] = value;
}

//-----END CONDITIONS-----//

//Resets the board and redraws it (fades in)
function resetAndRedraw()
{	
	//Reset board
	cur_level = JSON.parse(JSON.stringify(levels[level_num])); //Deep copy level
	board_rotation = 0;
	board_opacity = 1; //opaque
	border_color = '#000000';
	
	//Reset player
	player.row = cur_level.start_pos.row;
	player.col = cur_level.start_pos.col;
	player.squares_visited = 1;
	can_move = true;
	can_reset = true;
	
	//Redraw
	animateReset();
}

//Check if we're on the finish square.  If so, check if all squares were visited.  Also redraws the board accordingly
function checkWinAndRedraw()
{
	if(player.row == cur_level.finish_pos.row && player.col == cur_level.finish_pos.col) //on finish square
	{
		can_move = false;
		
		if(player.squares_visited >= cur_level.num_spaces) //valid win, the >= is a hack to make the level select work
		{
			if(level_num == levels.length-1) //finished!
			{
				animateEnd();
			}
			else
			{
				animateWin();
			}
		}
		else //didn't touch all spaces
		{
			border_color = '#ff0000'; //red
			draw();
		}
	}
	else //not on finish square
	{
		draw(); //draw board as usual
	}
}

//-----DRAWING-----//

//Draw the level based on cur_level data
function draw()
{
	//Clear canvas
	board_ctx.clearRect(0, 0, canvas_elem.width, canvas_elem.height);
	
	//Translate board to center of canvas
	board_ctx.save(); //save context
	var board_width = cur_level.width*SQUARE_SIZE + 20; //plus 10 on all sides for border line width
	var board_height = cur_level.height*SQUARE_SIZE + 20;
	var trans_x = canvas_elem.width/2 - board_width/2;
	var trans_y = canvas_elem.height/2 - board_height/2;
	board_ctx.translate(trans_x, trans_y);
	
	//Rotate about center (for win animation)
	board_ctx.translate(board_width/2, board_height/2);
	board_ctx.rotate(board_rotation);
	board_ctx.translate(-1*board_width/2, -1*board_height/2);
	
	//Set alpha (for reset animation)
	board_ctx.globalAlpha = board_opacity;
	
	//Draw border
	board_ctx.strokeStyle = border_color;
	board_ctx.lineWidth = 10;
	board_ctx.strokeRect(5, 5, board_width-10, board_height-10); //minus 10 to align border to corners
	
	//Draw level
	for(var r = 0; r < cur_level.height; ++r)
	{
		for(var c = 0; c < cur_level.width; ++c)
		{
			var type = cur_level.layout[r][c];
			board_ctx.fillStyle = getColor(type);
			if(type == WRAP_LEFT)
			{
				board_ctx.fillRect(c*SQUARE_SIZE, 10+r*SQUARE_SIZE, SQUARE_SIZE+10, SQUARE_SIZE);
			}
			else if(type == WRAP_RIGHT)
			{
				board_ctx.fillRect(10+c*SQUARE_SIZE, 10+r*SQUARE_SIZE, SQUARE_SIZE+10, SQUARE_SIZE);
			}
			else if(type == WRAP_UP)
			{
				board_ctx.fillRect(10+c*SQUARE_SIZE, r*SQUARE_SIZE, SQUARE_SIZE, SQUARE_SIZE+10);
			}
			else if(type == WRAP_DOWN)
			{
				board_ctx.fillRect(10+c*SQUARE_SIZE, 10+r*SQUARE_SIZE, SQUARE_SIZE, SQUARE_SIZE+10);
			}
			else
			{
				board_ctx.fillRect(10+c*SQUARE_SIZE, 10+r*SQUARE_SIZE, SQUARE_SIZE, SQUARE_SIZE);
			}
			
			//For level selection
			if(type < 0)
			{
				board_ctx.fillStyle = '#aaaaaa';
				board_ctx.fillText(-1*type, 10+c*SQUARE_SIZE + SQUARE_SIZE/2, 10+r*SQUARE_SIZE + SQUARE_SIZE/2); //write level number
			}
		}
	}
	
	//Draw player
	board_ctx.fillStyle = '#00ff00';
	board_ctx.fillRect(10+player.col*SQUARE_SIZE, 10+player.row*SQUARE_SIZE, SQUARE_SIZE, SQUARE_SIZE);
	
	board_ctx.restore(); //restore context
}

//Draw end credits
function drawCredits()
{
	//Clear canvas
	board_ctx.clearRect(0, 0, canvas_elem.width, canvas_elem.height);
	
	//Draw credits
	board_ctx.globalAlpha = board_opacity;
	board_ctx.fillStyle = '#aaaaaa';
	board_ctx.fillText('a game by kiran bhadury', 200, 50);
}

//Runs the win animation by calling spinBoard
function animateWin()
{
	can_move = false;
	can_reset = false; //do animation without interruption
	board_rotation = 0;
	board_opacity = 1;
	if(!is_level_select) //add new level to selection screen if we're not on the selection screen
	{
		++level_num;
		var levelselect = levels[levels.length-1];
		var squareToEdit = mapIndexToSnake(level_num+1, levelselect.width); //plus one bc levels start at 1
		addToLevel(levelselect.width, levelselect.layout, squareToEdit, -1*(level_num+1));
	}
	window.win_signal = window.setInterval(spinBoard, 20);
}
function spinBoard()
{
	board_rotation += 0.01 + 0.03*board_rotation; //speeds up as it rotates
	board_opacity -= 0.01;
	if(board_opacity < 0.03) //end animation
	{
		board_opacity = 0;
		window.clearInterval(window.win_signal);
		//++level_num;
		document.getElementById('levelcounter').innerHTML = (level_num+1) + ' / ' + levels.length;
		resetAndRedraw();
	}
	else
	{
		draw();
	}
}

//Runs the reset animation by calling fadeinBoard
function animateReset()
{
	can_reset = false;
	board_opacity = 0;
	window.reset_signal = window.setInterval(fadeinBoard, 20);
}
function fadeinBoard()
{
	board_opacity += 0.05;
	if(board_opacity > 1) //end animation
	{
		board_opacity = 1;
		window.clearInterval(window.reset_signal);
		can_reset = true;
	}
	draw();
}

//Runs the ending animation by calling spinEnd
function animateEnd()
{
	can_move = false;
	can_reset = false;
	board_rotation = 0;
	board_opacity = 1;
	border_color = '#00ff00';
	window.end_signal = window.setInterval(spinEnd, 20);
}
function spinEnd()
{
	board_rotation += 0.01 + 0.03*board_rotation; //speeds up as it rotates
	board_opacity -= 0.005;
	if(board_opacity < 0.03) //end animation
	{
		board_opacity = 0;
		window.clearInterval(window.end_signal);
		animateCredits();
	}
	else
	{
		draw();
	}
}
function animateCredits()
{
	board_opacity = 0;
	window.credits_signal = window.setInterval(fadeinCredits, 20);
}
function fadeinCredits()
{
	board_opacity += 0.01;
	if(board_opacity > 1)
	{
		board_opacity = 1;
		window.clearInterval(window.credits_signal);
		drawCredits();
	}
	else
	{
		drawCredits();
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
}

//Attempt to move player to specified position
function moveTo(next_row, next_col)
{
	var cur_square = cur_level.layout[this.row][this.col];

	//Change destination for wrapping squares
	if(cur_square == WRAP_LEFT || cur_square == WRAP_RIGHT)
	{
		next_col = (next_col + cur_level.width) % cur_level.width;
	}
	else if(cur_square == WRAP_UP || cur_square == WRAP_DOWN)
	{
		next_row = (next_row + cur_level.height) % cur_level.height;
	}
	
	//Check if valid move
	if(next_row >= cur_level.height || next_row < 0 || next_col >= cur_level.width || next_col < 0) return;
	var next_square = cur_level.layout[next_row][next_col];
	if(next_square == WALL || next_square == VISITED || next_square == START) return;
	
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
	this.row = next_row;
	this.col = next_col;
	this.squares_visited++; //update number of squares visited
}

//Keyboard input
document.addEventListener('keypress', function(event){
	if(event.key == 'r' && can_reset) resetAndRedraw();
	else
	{
		if(!can_move) return;
		switch(event.key)
		{
			case 'w':
				player.moveTo(player.row-1, player.col);
				break;
			case 's':
				player.moveTo(player.row+1, player.col);
				break;
			case 'a':
				player.moveTo(player.row, player.col-1);
				break;
			case 'd':
				player.moveTo(player.row, player.col+1);
				break;
			case 'k': //DEBUG
				level_num = 3;
				animateWin();
				break;
			case 'l':
				is_level_select = true;
				level_num = levels.length - 1;
				animateWin();
				break;
			case 'x':
				if(!is_level_select) return;
				var level = mapPlayerToLevel(player.row, player.col, levels[levels.length-1].width);
				if(level == 0) return; //can't select start square
				level_num = level - 1;
				animateWin();
				is_level_select = false;
				break;
		}
	}
	checkWinAndRedraw();
});