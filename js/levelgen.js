//Level data
var level_height;
var level_width;
var layout;
const MIN_HEIGHT = 3;
const MAX_HEIGHT = 8;
const MIN_WIDTH = 3;
const MAX_WIDTH = 8;
const MIN_COVERING = 0.5;
const MAX_COVERING = 1;

//Movement data
//Do NOT edit values w/o checking levels.js
const UP = 0;
const RIGHT = 1;
const LEFT = 2;
const DOWN = 3;
const WRAP = 6; //map to square consts, saves us some if-statements
const MAGIC = 3; //I know this is a hack please forgive me

//Random controller
var rng;

//Generate a random level given a seed
//The seed ensures that we can generate the same random levels each time
//Returns a Level object
function generateLevel(seed)
{
	//Init random number generator using David Bau's seedrandom
	rng = new Math.seedrandom(seed);
	
	//Init basic level info
	level_height = randToRangeInt(rng.quick(), MIN_HEIGHT, MAX_HEIGHT);
	level_width = randToRangeInt(rng.quick(), MIN_WIDTH, MAX_WIDTH);
	var start_row = randToRangeInt(rng.quick(), 0, level_height);
	var start_col = randToRangeInt(rng.quick(), 0, level_width);
	var min_steps = Math.floor(MIN_COVERING * (level_height * level_width));
	var max_steps = Math.floor(MAX_COVERING * (level_height * level_width));
	var num_steps = randToRangeInt(rng.quick(), min_steps, max_steps);
	
	//Generate empty board
	layout = [];
	for(var i = 0; i < level_height; ++i)
	{
		var row = [];
		for(var j = 0; j < level_width; ++j)
		{
			row.push(UNUSED);
		}
		layout.push(row);
	}
	
	//Set up path variable
	var path = [];
	path.push({row: start_row, col: start_col});
	
	//Init start square
	layout[start_row][start_col] = START;
	var current_pos = {row: start_row, col: start_col};
	
	//Start generating moves
	var step_count = 0;
	var available_directions = [UP, RIGHT, LEFT, DOWN];
	while(step_count < num_steps)
	{
		//Check if we're stuck
		if(available_directions.length == 0)
		{
			break;
		}
		
		//Choose a new move
		//Side note: current_pos will never be on an unused square
		var next_pos;
		var doWrap = false; //initially try moving without wrapping
		var index_chosen = randToRangeInt(rng.quick(), 0, available_directions.length);
		var direction = available_directions[index_chosen];
		next_pos = getPositionInDirection(current_pos, direction, doWrap);
		if(!isInBounds(next_pos, level_height, level_width)) //if out of bounds...
		{
			if(layout[current_pos.row][current_pos.col] == EMPTY) //if wrapping is an option, do so
			{
				doWrap = true;
				next_pos = getPositionInDirection(current_pos, direction, doWrap);
			}
			else //no moves, try another direction
			{
				//Remove direction from available directions list
				available_directions.splice(index_chosen, 1);
				continue; //try again
			}
		}
		//At this point next_pos is in bounds
		if(!isAvailableSquare(next_pos, doWrap)) //if not a valid move...
		{
			//Remove direction from available directions list
			available_directions.splice(index_chosen, 1);
			continue; //try again
		}
		
		//By this point, we've found a valid direction
		
		//Reset valid directions for next loop
		available_directions = [UP, RIGHT, LEFT, DOWN];
		
		//Update layout
		if(doWrap) //replace current square with a wrapper and update corresponding square
		{
			layout[current_pos.row][current_pos.col] = WRAP + direction;
			layout[next_pos.row][next_pos.col] = WRAP + (-1*direction + MAGIC); //map WRAP_UP to WRAP_DOWN along with all other pairs
		}
		//non-wrapping moves
		else if(layout[next_pos.row][next_pos.col] == UNUSED)
		{
			layout[next_pos.row][next_pos.col] = EMPTY;
		}
		else if(layout[next_pos.row][next_pos.col] == EMPTY)
		{
			layout[next_pos.row][next_pos.col] = HOLE;
		}
		
		//Update position
		current_pos.row = next_pos.row;
		current_pos.col = next_pos.col;
		path.push({row: current_pos.row, col: current_pos.col});
		
		++step_count;
	} //while loop
	
	//Remove last square from path so we won't backtrack on ourself
	path.pop();
	
	//Place finish square (will overwrite most-recently placed square)
	//If current square is empty or unused, we're good, otherwise we need to find a new square
	while(layout[current_pos.row][current_pos.col] != EMPTY && layout[current_pos.row][current_pos.col] != UNUSED)
	{
		var possible_direction = findUnusedDirection(current_pos);
		if(possible_direction == -1) //no unused spaces nearby, must backtrack
		{
			//Current square is either hole or wrap
			if(layout[current_pos.row][current_pos.col] == HOLE)
			{
				layout[current_pos.row][current_pos.col] = EMPTY;
				current_pos = path.pop(); //path should never be empty (worst case: finish is 1 hop from start)
			}
			else //wrap
			{
				layout[current_pos.row][current_pos.col] = UNUSED;
				current_pos = path.pop();
				layout[current_pos.row][current_pos.col] = EMPTY; //basically guarantees the finish will be placed here
			}
		}
		else
		{
			current_pos = getPositionInDirection(current_pos, possible_direction, false); //finish square can't be wrapped
		}
	}
	layout[current_pos.row][current_pos.col] = FINISH;
	
	//Remove excessive unused spaces
	trimLayout();
	level_height = layout.length;
	level_width = layout[0].length;
	
	//Fill in remaining spaces with walls
	for(var r = 0; r < level_height; ++r)
	{
		for(var c = 0; c < level_width; ++c)
		{
			if(layout[r][c] == UNUSED)
			{
				layout[r][c] = WALL;
			}
		}
	}
	
	//Return level
	return new Level(level_width, level_height, layout);
}

//Returns the new position in the given direction of the given position
//Perform wrapping if desired
//If wrapping is off, resulting position may be out of bounds
function getPositionInDirection(pos, dir, doWrap)
{
	var next_pos;
	switch(dir)
	{
		case UP:
			next_pos = {row: pos.row - 1, col: pos.col};
			break;
		case DOWN:
			next_pos = {row: pos.row + 1, col: pos.col};
			break;
		case LEFT:
			next_pos = {row: pos.row, col: pos.col - 1};
			break;
		case RIGHT:
			next_pos = {row: pos.row, col: pos.col + 1};
			break;
	}
	
	if(doWrap)
	{
		next_pos.row = (next_pos.row + level_height) % level_height;
		next_pos.col = (next_pos.col + level_width) % level_width;
	}
	return next_pos;
}

//Check if the given square can become part of the path
function isAvailableSquare(pos, doWrap)
{
	var square = layout[pos.row][pos.col];
	if(doWrap) //don't allow for holes
	{
		return square == UNUSED;
	}
	else //may create holes
	{
		return (square == UNUSED || square == EMPTY);
	}
}

//Convenience function to check if the given square is unused
function isUnusedSquare(pos)
{	
	return (layout[pos.row][pos.col] == UNUSED);
}

//Returns a random direction towards an unused square
//If there are none, returns -1
//This is only used for placing the finish square, which can't be wrapped, so disable wrapping
function findUnusedDirection(pos)
{
	var available_directions = [];
	var pos_up = getPositionInDirection(pos, UP, false);
	var pos_down = getPositionInDirection(pos, DOWN, false);
	var pos_left = getPositionInDirection(pos, LEFT, false);
	var pos_right = getPositionInDirection(pos, RIGHT, false);
	
	if(isInBounds(pos_up, level_height, level_width) && isUnusedSquare(pos_up)) available_directions.push(UP);
	if(isInBounds(pos_right, level_height, level_width) && isUnusedSquare(pos_right)) available_directions.push(RIGHT);
	if(isInBounds(pos_left, level_height, level_width) && isUnusedSquare(pos_left)) available_directions.push(LEFT);
	if(isInBounds(pos_down, level_height, level_width) && isUnusedSquare(pos_down)) available_directions.push(DOWN);
	
	if(available_directions.length == 0)
	{
		return -1;
	}
	else
	{
		return available_directions[randToRangeInt(rng.quick(), 0, available_directions.length)];
	}
}

//Test if a row in the layout contains all unused squares
function isRowUnused(row)
{
	test_row = layout[row];
	for(var i = 0; i < test_row.length; ++i)
	{
		if(test_row[i] != UNUSED)
		{
			return false;
		}
	}
	return true;
}

//Test if a column in the layout contains all unused squares
function isColUnused(col)
{
	for(var i = 0; i < layout.length; ++i)
	{
		if(layout[i][col] != UNUSED)
		{
			return false;
		}
	}
	return true;
}

//Removes unused rows and columns from layout
function trimLayout()
{
	//Trim top
	var first_real_row = 0;
	while(isRowUnused(first_real_row))
	{
		++first_real_row;
	}
	layout.splice(0, first_real_row);
	
	//Trim bottom
	var last_real_row = layout.length - 1;
	while(isRowUnused(last_real_row))
	{
		--last_real_row;
	}
	layout.splice(last_real_row + 1); //deletes to end of layout
	
	//Trim left
	var first_real_col = 0;
	while(isColUnused(first_real_col))
	{
		++first_real_col;
	}
	layout.forEach(function(row){
			row.splice(0, first_real_col);
		});
		
	//Trim right
	var last_real_col = layout[0].length - 1;
	while(isColUnused(last_real_col))
	{
		--last_real_col;
	}
	layout.forEach(function(row){
			row.splice(last_real_col + 1);
		});
}

//Takes a random float between 0 and 1 and scales to an int between lowerBound (incl) and upperBound (excl)
function randToRangeInt(rand, lowerBound, upperBound)
{
	return Math.floor(lowerBound + rand*(upperBound - lowerBound));
}

//Takes a random float between 0 and 1 and scales to a float between lowerBound (incl) and upperBound (excl)
function randToRangeFloat(rand, lowerBound, upperBound)
{
	return lowerBound + rand*(upperBound - lowerBound);
}