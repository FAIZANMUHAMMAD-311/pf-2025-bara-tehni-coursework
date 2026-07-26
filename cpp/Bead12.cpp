#include<iostream>
#include<fstream>
#include<cstdlib>
#include<iomanip>
#include<windows.h>

using namespace std;

// fixed 5x5 board
const int Size_Board = 5; 
char board[Size_Board][Size_Board];

// player names
char player1_name[50];
char player2_name[50];

int current_player;
int player1_beads = 12;
int player2_beads = 12;

bool is_computer = false;

// for undo/ redo stuff
const int max_moves = 100;
char board_history[max_moves][Size_Board][Size_Board];
int player_history[max_moves];
int beads_history[max_moves][2];
int move_count = 0;
int current_move = 0;

// changes console text color
void color(int L){
    HANDLE hConsole = GetStdHandle(STD_OUTPUT_HANDLE);
    SetConsoleTextAttribute(hConsole, L);
}

//sets up the starting board
void initializeBoard() {

    // This is for first 2 row player 1
    for (int i = 0; i < 2; i++) {
        for (int j = 0; j < Size_Board; j++) {
            board[i][j] = 'X';
        }
    }

    // This is for middle row

    board[2][0] = 'X';
    board[2][1] = 'X';
    board[2][2] = '.';
    board[2][3] = 'O';
    board[2][4] = 'O';

    // This is for last 2 row player 2

    for (int i = 3; i < Size_Board; i++) {
        for (int j = 0; j < Size_Board; j++) {
            board[i][j] = 'O';
        }
    }

    board[2][2] = '.';
}

//just printed the grid

void displayboard() { 
    color(14);
    cout << "\n========= BAARA TEHNI =========\n"<<endl;
    color(11);

    cout << "      0   1   2   3   4\n";
    color(8);
    cout << "    +---+---+---+---+---+\n";

    for (int i = 0; i < Size_Board; i++) {
        color(11);
        cout << " " << i << " ";
        color(8);
        cout << " | ";
        for (int j = 0; j < Size_Board; j++) {
            if (board[i][j] == 'X') {
                color(12);  //red for X
                cout << board[i][j];
            }
            else if(board[i][j]=='O') {
                color(10); // green for O
                cout << board[i][j];
            }
            else {
                color(8);  // gray for empty
                cout << board[i][j];
            }
            color(8);
            cout << " | ";

        }
        cout << "\n";
        cout << "    +---+---+---+---+---+\n";
     
    }

    color(7);
}

// coin toss to decide who goes first
int coin_toss() {

    color(14);
    cout << "\nCoin Toss! Press 1 for Heads, 2 for Tails: ";
    color(7);

    int choice;
    cin >> choice;

    // generate random coin flip result 
    int result = (rand() % 2 + 1);

    //show the coin flip result 
    color(11);
    if (result == 1) {
        cout << "Result: Heads"<<endl;
    }
    else {
        cout << "Result: Tails"<<endl;
    }
    color(7);

    
    if (result == choice) {
        return 1; 
    }
    else {
        return 2;
    }
}

// checks if a regular move is valid
bool isValidmove(int from_row, int from_col, int to_row, int to_col, char playerChar) {

    // checking boundries
    if (to_row < 0 || to_row >= Size_Board || to_col < 0 || to_col >= Size_Board) { 
        return false;
    }

    // destination must be empty 
    if (board[to_row][to_col] != '.') {
        return false;
    }

    // calculate distance
    int new_row = to_row - from_row;
    int new_col = to_col - from_col;

    // only allow 1 step in any direction
    if (new_row >= -1 && new_row <= 1 && new_col >= -1 && new_col <= 1 ) {
        if (!(new_row == 0 && new_col == 0)) {
            return true;
        }
    }

    return false;
}

bool isValidCapture(int from_row, int from_col, int to_row, int to_col, char playerChar, int& capR, int& capC) {

    // checking boundries
    if (to_row < 0 || to_row >= Size_Board || to_col < 0 || to_col >= Size_Board) {
        return false;
        
    }

    if (board[to_row][to_col] != '.') {
        return false;
    }

    int new_row = to_row - from_row; 
    int new_col = to_col - from_col; 

    // for capture you can jump exactly 2 spaces
    bool validDistance = false;
    if ((new_row == -2 || new_row == 0 || new_row == 2) && (new_col == -2 || new_col == 0 || new_col == 2)) {
        if (!(new_row == 0 && new_col == 0)) {
            validDistance = true;
 
        }
    }

    if (!validDistance) {
        return false;
    }

    // find the piece we are jumping over
    capR = from_row + new_row / 2; 
    capC = from_col + new_col / 2;

    char opponent;

    // figuring out opponents symbol

    if (playerChar == 'X') { 
        opponent = 'O';
    }
    else {
        opponent = 'X';  
    }

    // check if theres an opponent piece to capture
    if (board[capR][capC] == opponent) {
        return true;
    }

    return false;
}


int make_move(int from_row, int from_col, int to_row, int to_col, char playerChar) {
    // first try a simple move 
    if (isValidmove(from_row, from_col, to_row, to_col, playerChar )) {
        board[to_row][to_col] = playerChar;
        board[from_row][from_col] = '.';
        cout << "Move successful!" << endl;
        return 1;  
    }

    // try capture move
    int cap_row, cap_col;

    if (isValidCapture(from_row, from_col, to_row, to_col, playerChar, cap_row, cap_col)) {
        board[to_row][to_col] = playerChar;
        board[from_row][from_col] = '.';
        board[cap_row][cap_col] = '.'; // remove the captured piece

        //reducing the beads count for opponenet
        if (playerChar == 'X') {
            player2_beads--;  
        }
        else {
            player1_beads--;  
        }

        cout << "Captured opponent's bead! " << endl;
        return 2;
    }

    cout << "Invalid move! Please try a different move." << endl;
    return 0;
}

// check if player can capture again after a capture
bool can_capture_again(int row, int col, char playerChar) {

    // all 8 direction checking
    int change_row[8] = { -1,1,0,0,-1,-1,1,1 };
    int change_col[8] = { 0,0,-1,1,-1,1,-1,1 };

    // loop through all direction
    for (int k = 0; k < 8; k++) {
        int jump_row = row + change_row[k] * 2;
        int jump_col = col + change_col[k] * 2;
        int cap_row, cap_col;

        if (isValidCapture(row, col, jump_row, jump_col, playerChar, cap_row, cap_col)) {
            return true;
        }
    }

    return false;
}

// check any valid move left on board
bool hasAnyMove(char playerChar) {

    //checking all 8 direction
    int change_row[8] = { -1,1,0,0,-1,-1,1,1 };
    int change_col[8] = { 0,0,-1,1,-1,1,-1,1 };

    // go through every cell on board
    for (int i = 0; i < Size_Board; i++) {
        for (int j = 0; j < Size_Board; j++) {

            if (board[i][j] == playerChar) {
                for (int k = 0; k < 8; k++) {
                    // found player piece
                    int new_row = i + change_row[k];
                    int new_col = j + change_col[k];

                    // check simple move
                    if (isValidmove(i, j, new_row, new_col, playerChar)) {
                        return true;
                    }

                    // check capture move
                       int cap_row, cap_col;
                       int jump_row = i + change_row[k] * 2;
                       int jump_col = j + change_col[k] * 2;


                    if (isValidCapture(i, j, jump_row, jump_col, playerChar, cap_row, cap_col)) {
                            return true;
                    }
                    
                }
            }
        }
    }

    return false;
    
}

// save current game to file 

void save_game() {
    ofstream wrt("savegame.txt");

    if (!wrt) {
        color(12);
        cout << "Error saving game!" << endl;
        color(7);
        return;
    }

    // writing players names
    wrt << player1_name << endl;
    wrt<< player2_name << endl;

    // writing whos current turn 
    wrt << current_player << endl;

    // write beads count for both
    wrt << player1_beads << endl;
    wrt << player2_beads << endl;

    // write board state
    for (int i = 0; i < Size_Board; i++) {
        for (int j = 0; j < Size_Board; j++) {
            wrt << board[i][j];
        }
        wrt<< endl;
    }

    wrt.close();

    color(10);
    cout << "Game saved successfully!" << endl;
    color(7);

}

bool loadGame() {
    ifstream rdr("savegame.txt");

    if (!rdr) {
        return false;
    }

    // read game stats 
    rdr.getline(player1_name, 50);
    rdr.getline(player2_name, 50);
    rdr >> current_player;
    rdr >> player1_beads;
    rdr >> player2_beads;

    rdr.ignore();
    // read the board
    for (int i = 0 ; i < Size_Board; i++) {
        for (int j = 0; j < Size_Board; j++) {
            rdr >> board[i][j];
        }
    }

    rdr.close();

    color(10);
    cout << "Game loaded successfully!" << endl;
    color(7);

    return true;
}

// display the main menu
int main_menu() {
    color(11);
    cout << "\n===============================\n";
    cout << "           MAIN MENU            \n";
    cout << "===============================\n";
    color(7);

    cout << "1. New Game\n";
    cout << "2. Load saved Game\n";
    cout << "3. Exit \n";
    cout << "\nEnter choice: ";

    int choice;
    cin >> choice;
    cin.ignore();

    return choice;
}

// saves current board state for undo/redo 
void save_board_state() {
    
    if (move_count >= max_moves) {
        color(12);
        cout << "Move history full! Cannot save more moves." << endl;
        color(7);
        return;
    }

    // copy the current board to history
    for (int i = 0; i < Size_Board; i++) {
        for (int j = 0; j < Size_Board; j++) {
            board_history[move_count][i][j] = board[i][j];
        }
    }

    // save player turn and bead counts
    player_history[move_count] = current_player;
    beads_history[move_count][0] = player1_beads;
    beads_history[move_count][1] = player2_beads;

    move_count++;
    current_move = move_count;
}

void undo_move() {
    if (move_count <= 1) {
        color(12);
        cout << "No moves to undo!" << endl;
        color(7);
        return;
    }

    move_count--;
    current_move = move_count;

    // restore the board from history
    for (int i = 0; i < Size_Board; i++) {
        for (int j = 0; j < Size_Board; j++) {
            board[i][j] = board_history[move_count - 1][i][j];
        }
    }

    // restore the player stats
    current_player = player_history[move_count - 1];
    player1_beads = beads_history[move_count - 1][0];
    player2_beads = beads_history[move_count - 1][1];

    color(10);
    cout << "Move undone! " << endl;
    color(7);
}

void redo_move() {
    if (current_move >= move_count) {
        color(12);
        cout << "No moves to redo!" << endl;
        color(7);
        return;
    }

    // restore board
    for (int i = 0; i < Size_Board; i++) {
        for (int j = 0; j < Size_Board; j++) {
            board[i][j] = board_history[current_move][i][j];
        }
    }

    // restore player and beads 
    current_player = player_history[current_move];
    player1_beads = beads_history[current_move][0];
    player2_beads = beads_history[current_move][1];

    current_move ++;
    move_count = current_move;

    color(10);
    cout << "Move redone!" << endl;
    color(7);
}

// BONUS
// handles the bot player moves

void computer_move() {
    color(11);
    cout << "\nComputer is thinking..." << endl;
    color(7);

    Sleep(1000);

    char PlayerChar = 'O';

    int change_row[8] = { -1,1,0,0,-1,-1,1,1 };
    int change_col[8] = { 0,0,-1,1,-1,1,-1,1 };

    // first priority: look for capture moves
    for (int i = 0; i < Size_Board; i++) {
        for (int j = 0; j < Size_Board; j++) {
            if (board[i][j] == PlayerChar) {

                //check all 8 directions
                for (int k = 0; k < 8; k++) {
                    int jump_row = i + change_row[k] * 2;
                    int jump_col = j + change_col[k] * 2;
                    int cap_row, cap_col;

                    if (isValidCapture(i, j, jump_row, jump_col, PlayerChar, cap_row, cap_col)) {
                        color(10);
                        cout << "Computer captures a bead! " << endl;
                        color(7);

                        make_move(i, j, jump_row, jump_col, PlayerChar);
                        return;
                    }
                }
            }
        }
    }

    // second priority: make a simple move 
    for (int i = 0; i < Size_Board; i++) {
        for (int j = 0; j < Size_Board; j++) {
            if (board[i][j] == PlayerChar) {

                // check all directions for simple move
                for (int k = 0; k < 8; k++) {
                    int new_row = i + change_row[k];
                    int new_col = j + change_col[k];

                    if (isValidmove(i, j, new_row, new_col, PlayerChar)) {
                        color(10);
                        cout << "computer moves: (" << i << "," << j << ") to (" << new_row << "," << new_col << ")" << endl;
                        color(7);
                        make_move(i, j, new_row, new_col, PlayerChar);

                        if (can_capture_again(new_row, new_col, PlayerChar)) {
                            color(11);
                            cout << "Computer can capture again!" << endl;
                            color(7);
                            Sleep(1000);
                        }
                        return;
                    }
                }
            }
        }
    }

}


int main() {

    //shows menu get user choice
    int menu_choice = main_menu();
    if (menu_choice == 3) {
        cout << "Thanks for playing!" << endl;
        return 0;
    }

    // try loading saved game
    if (menu_choice == 2) {
        if (loadGame()) {
            cout << "Resuming saved games....." << endl;
            cout << "Current player: " << current_player << endl;
        }
        else {
            color(12);
            cout << "No saved game found! Starting new game...." << endl;
            color(7);
            menu_choice = 1;
        }
    }

    // start a new game
    if (menu_choice == 1) {
        system("cls");
        color(11);

        cout << "\n===============================\n";
        cout << "    BAARA TEHNI (12 BEADS)     \n";
        cout << "===============================\n" << endl;

        initializeBoard();
        displayboard();
        cout << "Board initialized.\n";
        color(7);

        cout << "Enter Player 1 name: ";
        cin.getline(player1_name, 50);

        cout << "Enter Player 2 name (type 'Computer' for bot): ";
        cin.getline(player2_name, 50);

        if (player2_name[0] == 'C' && player2_name[1] == 'o' && player2_name[2] == 'm' && player2_name[3] == 'p') {
            is_computer = true;

        }

        current_player = coin_toss();

        if (current_player == 1) {
            cout << player1_name << " will make the first move." << endl;
        }
        else {
            cout << player2_name << " will make the first move." << endl;
        }

        cout << "Starting Player: " << current_player;
        if (current_player == 1) {
            cout << player1_name << endl;
        }
        else if (current_player == 2) {
            cout << player2_name << endl;
        }

        // save initiall state for undo 
        save_board_state();

    }

    // main game loop
    while (true) {
        system("cls");
        displayboard();

        color(14);
        cout << "\n--- Player " << current_player << "'s Turn ---" << endl;
        color(7);

        // checking which symbol current player uses
        char playerChar;
        if (current_player == 1) {
            playerChar = 'X';
        }
        else {
            playerChar = 'O';
        }

        // if player stuck no moves left
        if (!hasAnyMove(playerChar)) {
            color(14);
            cout << "\nPlayer " << current_player << " has no valid moves left!" << endl;
            if (current_player == 1) {
                cout << "Player 2 wins!" << endl;
            }
            else {
                cout << "Player 1 wins!" << endl;
            }
            color(7);
            break;
        }

        if (current_player == 1 && player2_beads == 0) {
            color(12);
            cout << "\n" << player1_name << " wins! All opponent beads captured!" << endl;
            color(7);
            break;
        }
        else if (current_player == 2 && player1_beads == 0) {
            color(10);
            cout << "\n" << player2_name << " wins! All opponents beads captured!" << endl;
            color(7);

            break;
        }
        cout << endl;

        cout << "Beads remaining - Player 1: " << player1_beads << " | player 2: " << player2_beads << endl;

        int from_row, from_col, to_row, to_col;

        if (is_computer && current_player == 2) {
            computer_move();
            save_board_state();
            current_player = 1;
            Sleep(1500);
            continue;
        }

        // human player moves
        cout << "Enter move (from_row  from_col  to_row  to_col) OR -1 to save and quit / -2 (undo) / -3 (redo): ";
        cin >> from_row;

        if (from_row == -1) {
            save_game();
            cout << "Game saved! Exiting...." << endl;
            return 0;
        }

        // undo last move
        if (from_row == -2) {
            undo_move();
            continue;
        }

        //redo move
        if (from_row == -3) {
            redo_move();
            continue;
        }

        cin >> from_col >> to_row >> to_col;

        // validating position
        if (from_row < 0 || from_row >= Size_Board || from_col < 0 || from_col >= Size_Board) {
            color(12);
            cout << "Invalid source position!" << endl;
            color(7);
            continue;
        }

        // make sure selected own beads
        if (board[from_row][from_col] != playerChar) {
            color(12);
            cout << "That's not your bead!" << endl;
            color(7);
            continue;
        }

        
        int move_result = make_move(from_row, from_col, to_row, to_col, playerChar);
        if (move_result > 0) {
            save_board_state();

            // check for again capture
            if (move_result == 2 && can_capture_again(to_row, to_col, playerChar)) {
                color(11);
                cout << "\n You can capture again! " << endl;
                color(7);

                cout << "Press any key to continue..." << endl;
                cin.ignore();
                cin.get();
            }
            else {
                // switch to other player

                if (current_player == 1) {
                    current_player = 2;
                }
                else {
                    current_player = 1;
                }
            }
        }
         

    }



    cout << "\n Game over! Thanks for playing!" << endl;

  
    return 0;
}

