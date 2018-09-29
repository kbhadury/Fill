//Levels for the game are defined in this file

//Constructor for a Level object
//height and width are integers, layout is a (height x width) 2d array
//start_pos and finish_pos contain the row and column of those spaces
function Level(w, h, l)
{
	this.width = w;
	this.height = h;
	this.layout = l;
	
	//Find start and finish points along with total number of spaces
	this.start_pos = null;
	this.finish_pos = null;
	this.num_spaces = this.width * this.height;
	for(var r = 0; r < this.height; ++r)
	{
		for(var c = 0; c < this.width; ++c)
		{
			//NOTE: this will not catch multiple start/finish positions
			if(this.layout[r][c] == START)
			{
				this.start_pos = {row:r, col:c};
			}
			else if(this.layout[r][c] == FINISH)
			{
				this.finish_pos = {row:r, col:c};
			}
			else if(this.layout[r][c] == WALL)
			{
				this.num_spaces--;
			}
		}
	}
	if(this.start_pos == null || this.finish_pos == null)
	{
		alert("Start or finish position missing!");
	}
}

//Square data
//ONLY add constants to the END of this list
const EMPTY = 0;
const START = 1;
const FINISH = 2;
const VISITED = 3;
const WALL = 4;
const HOLE = 5;
const WRAP_UP = 6;
const WRAP_RIGHT = 7;
const WRAP_LEFT = 8;
const WRAP_DOWN = 9;
const UNUSED = 10; //for level generation

//Returns the color that corresponds with each type of square
function getColor(type)
{
	switch(type)
	{
		case START:
		case VISITED:
			return '#00ff00';
		case FINISH:
			return '#66d9ff';
		case EMPTY:
		case WRAP_LEFT:
		case WRAP_RIGHT:
		case WRAP_UP:
		case WRAP_DOWN:
			return '#eeeeee';
		case WALL:
			return '#000000';
		case HOLE:
			return '#aaaaaa';
	}
}

//Returns true if the square can be moved onto
function isOpenSquare(square)
{
	switch(square)
	{
		case EMPTY:
		case FINISH:
		case HOLE:
		case WRAP_LEFT:
		case WRAP_RIGHT:
		case WRAP_UP:
		case WRAP_DOWN:
			return true;
		default:
			return false;
	}
}

//Returns true if the given square is one of the wrap options
function isWrapSquare(square)
{
	return (square == WRAP_UP || square == WRAP_DOWN || square == WRAP_LEFT || square == WRAP_RIGHT);
}

//Generic bounds check
function isInBounds(pos, height, width)
{
	return (pos.row >= 0 && pos.row < height && pos.col >= 0 && pos.col < width);
}

//Starting out
var start_width = 5;
var start_height = 1;
var start_layout = [
	[START, EMPTY, EMPTY, EMPTY, FINISH]
	];
var start_l = new Level(start_width, start_height, start_layout); //suffix _l for level

//Intro to turning
var turns_width = 3;
var turns_height = 3;
var turns_layout = [
	[EMPTY, EMPTY, EMPTY],
	[EMPTY, EMPTY, EMPTY],
	[START, EMPTY, FINISH]
	];
var turns_l = new Level(turns_width, turns_height, turns_layout);

//Intro to walls
var walls_width = 4;
var walls_height = 4;
var walls_layout = [
	[START, WALL,  FINISH, EMPTY],
	[EMPTY, EMPTY, WALL,   EMPTY],
	[EMPTY, EMPTY, WALL,   EMPTY],
	[EMPTY, EMPTY, EMPTY,  EMPTY]
	];
var walls_l = new Level(walls_width, walls_height, walls_layout);

//Five by five empty with two walls
var fiveempty_width = 5;
var fiveempty_height = 5;
var fiveempty_layout = [
	[EMPTY, EMPTY, EMPTY, EMPTY, EMPTY],
	[EMPTY, EMPTY, EMPTY, EMPTY, EMPTY],
	[EMPTY, EMPTY, WALL,  WALL,  EMPTY],
	[EMPTY, EMPTY, EMPTY, EMPTY, EMPTY],
	[START, EMPTY, EMPTY, EMPTY, FINISH]
	];
var fiveempty_l = new Level(fiveempty_width, fiveempty_height, fiveempty_layout);

//Intro to holes
var hole_width = 3;
var hole_height = 3;
var hole_layout = [
	[WALL,  FINISH, WALL],
	[START, HOLE,   EMPTY],
	[WALL,  EMPTY,  EMPTY]
	];
var hole_l = new Level(hole_width, hole_height, hole_layout);

//Backtracking
var backtrack_width = 7;
var backtrack_height = 3;
var backtrack_layout = [
	[EMPTY, EMPTY, EMPTY, EMPTY, HOLE,  EMPTY,  EMPTY],
	[EMPTY, WALL,  EMPTY, WALL,  EMPTY, WALL,   EMPTY],
	[START, EMPTY, HOLE,  EMPTY, EMPTY, FINISH, EMPTY]
	];
var backtrack_l = new Level(backtrack_width, backtrack_height, backtrack_layout);

//Hole block
var holeblock_width = 4;
var holeblock_height = 4;
var holeblock_layout = [
	[EMPTY, EMPTY, FINISH, START],
	[EMPTY, HOLE,  HOLE,   EMPTY],
	[EMPTY, HOLE,  HOLE,   EMPTY],
	[EMPTY, EMPTY, EMPTY,  EMPTY]
	];
var holeblock_l = new Level(holeblock_width, holeblock_height, holeblock_layout);

//Intro to wrapping
var wrap_width = 3;
var wrap_height = 3;
var wrap_layout = [
	[WRAP_LEFT, EMPTY, WRAP_RIGHT],
	[EMPTY,     EMPTY, EMPTY],
	[START,     WALL,  FINISH]
	];
var wrap_l = new Level(wrap_width, wrap_height, wrap_layout);

//You don't always need to wrap!
var extrawrap_width = 5;
var extrawrap_height = 4;
var extrawrap_layout = [
	[WRAP_LEFT, START, WRAP_UP,   EMPTY,  WRAP_RIGHT],
	[WALL,      WALL,  WALL,      EMPTY,  EMPTY],
	[EMPTY,     EMPTY, EMPTY,     EMPTY,  EMPTY],
	[WRAP_LEFT, EMPTY, WRAP_DOWN, FINISH, WRAP_RIGHT]
	];
var extrawrap_l = new Level(extrawrap_width, extrawrap_height, extrawrap_layout);

//Lots of wrapping
var allwrap_width = 5;
var allwrap_height = 5;
var allwrap_layout = [
	[FINISH,    WRAP_UP,   EMPTY, WRAP_UP,   EMPTY,],
	[WRAP_LEFT, WALL,      EMPTY, WALL,      WRAP_RIGHT],
	[EMPTY,     EMPTY,     HOLE,  EMPTY,     START],
	[WRAP_LEFT, WALL,      EMPTY, WALL,      WRAP_RIGHT],
	[WALL,      WRAP_DOWN, EMPTY, WRAP_DOWN, EMPTY]
	];
var allwrap_l = new Level(allwrap_width, allwrap_height, allwrap_layout);

//All levels are stored here
var levels = [
	start_l,
	turns_l,
	walls_l,
	fiveempty_l,	
	hole_l,
	backtrack_l,
	holeblock_l,
	wrap_l,
	//extrawrap_l,  //not necessary, this level only causes confusion
	allwrap_l
	];