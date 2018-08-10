//Level data
var level_height;
var level_width;
var layout;

//Generate a random level given a seed
//The seed ensures that we can generate the same random levels each time
//Returns a Level object
//TODO: handle wrapping squares
function generateLevel(seed)
{
	//Init random number generator using David Bau's seedrandom
	var rng = new Math.seedrandom(seed);
	
	//Init basic level info
	level_height = randToRangeInt(rng.quick(), 3, 8);
	level_width = randToRangeInt(rng.quick(), 3, 8);
	var start_row = randToRangeInt(rng.quick(), 0, level_height);
	var start_col = randToRangeInt(rng.quick(), 0, level_width);
	var min_steps = Math.floor(0.75 * (level_height * level_width));
	var max_steps = level_height * level_width;
	var num_steps = randToRangeInt(rng.quick(), min_steps, max_steps);
	
	//Generate empty board
	layout = [];
	for(i = 0; i < level_height; ++i)
	{
		var row = [];
		for(j = 0; j < level_width; ++j)
		{
			row.push(UNUSED);
		}
		layout.push(row);
	}
	
	//Init start square
	layout[start_row][start_col] = START;
	var current_pos = {row: start_row, col: start_col};
	
	//Start generating moves
	var step_count = 0;
	var available_directions = [0, 1, 2, 3];
	while(step_count < num_steps)
	{
		//Check if we're stuck
		if(available_directions.length == 0)
		{
			break;
		}
		
		//Choose a new move
		var next_pos;
		var index_chosen = randToRangeInt(rng.quick(), 0, available_directions.length);
		var direction = available_directions[index_chosen];
		switch(direction)
		{
			case 0: //UP
				next_pos = {row: current_pos.row - 1, col: current_pos.col};
				break;
			case 1: //DOWN
				next_pos = {row: current_pos.row + 1, col: current_pos.col};
				break;
			case 2: //LEFT
				next_pos = {row: current_pos.row, col: current_pos.col - 1};
				break;
			case 3: //RIGHT
				next_pos = {row: current_pos.row, col: current_pos.col + 1};
				break;
		}
		if(!isValidSquare(next_pos.row, next_pos.col)) //if not a valid move...
		{
			//Remove direction from available directions list
			available_directions.splice(index_chosen, 1);
			continue; //try again
		}
		
		console.log(direction); //strictly for cheating purposes
		
		//Reset valid directions
		available_directions = [0, 1, 2, 3];
		
		//Update layout
		if(layout[next_pos.row][next_pos.col] == UNUSED)
		{
			layout[next_pos.row][next_pos.col] = EMPTY;
		}
		else if(layout[next_pos.row][next_pos.col] == EMPTY)
		{
			layout[next_pos.row][next_pos.col] = HOLE;
		}
		else
		{
			alert('Layout error'); //debug
		}
		
		//Update position
		current_pos.row = next_pos.row;
		current_pos.col = next_pos.col;		
		
		++step_count;
	} //while loop
	
	//Place finish square (will overwrite most-recently placed square)
	layout[current_pos.row][current_pos.col] = FINISH;
	
	//Fill in remaining spaces with walls
	for(r = 0; r < level_height; ++r)
	{
		for(c = 0; c < level_width; ++c)
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

function isValidSquare(row, col)
{
	//Check if in bounds
	if(row < 0 || row >= level_height || col < 0 || col >= level_width)
	{
		return false;
	}
	
	//Check if square available
	var square = layout[row][col];
	if(square == START || square == HOLE)
	{
		return false;
	}
	
	return true;
}