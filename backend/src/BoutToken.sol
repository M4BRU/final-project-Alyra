// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

// Layout of Contract:
// version
// imports
// interfaces, libraries, contracts
// errors
// Type declarations
// State variables
// Events
// Modifiers
// Functions

// Layout of Functions:
// constructor
// receive function (if exists)
// fallback function (if exists)
// external
// public
// internal
// private
// view & pure functions

import {ERC20Burnable, ERC20} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract BoutToken is ERC20Burnable, Ownable{

    error BoutToken__AddressNotCorrect();
    error BoutToken__OnlyTrackerCanAccess();
    error BoutToken__AmountNotEnough();

    event TrackerUpdated(address indexed oldTracker, address indexed newTracker);
    event TokensMinted(address indexed to, uint256 amount);

    modifier onlyTracker(){
        if(msg.sender != tracker)
        {
            revert BoutToken__OnlyTrackerCanAccess();
        }
        else{
            _;
        }
        
    }

    address public tracker;

    constructor(address _tracker) ERC20("BoutToken","BOUT") Ownable(msg.sender){
        tracker = _tracker;
    }

    function mint(address to, uint256 amount) external onlyTracker{
        if(to == address(0)){
            revert BoutToken__AddressNotCorrect();
        }
        if(amount <= 0){
            revert BoutToken__AmountNotEnough();
        }
        _mint(to, amount);

        emit TokensMinted(to, amount);
    }

    function setTracker(address _tracker) external onlyOwner{
        if(_tracker == address(0))
        {
            revert BoutToken__AddressNotCorrect();
        }
        address oldTracker = tracker;
        tracker = _tracker;

        emit TrackerUpdated(oldTracker, tracker);
    }

}