// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import {ERC20Burnable, ERC20} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract BoutToken is ERC20Burnable, Ownable {
    error BoutToken__AddressNotCorrect();
    error BoutToken__OnlyTrackerCanAccess();
    error BoutToken__AmountNotEnough();

    event TrackerUpdated(address indexed oldTracker, address indexed newTracker);
    event TokensMinted(address indexed to, uint256 amount);

    modifier onlyTracker() {
        if (msg.sender != tracker) {
            revert BoutToken__OnlyTrackerCanAccess();
        } else {
            _;
        }
    }

    address public tracker;

    constructor(address _tracker) ERC20("BoutToken", "BOUT") Ownable(msg.sender) {
        tracker = _tracker;
    }

    /**
     * @notice Mints BOUT tokens as rewards for ecological actions
     * @param to The address that will receive the newly minted tokens
     * @param amount The amount of tokens to mint (in wei, e.g., 10 * 1e18 = 10 BOUT)
     * @dev Creates new tokens on-demand when users withdraw their rewards
     * @custom:access onlyTracker (only BoutTracker can mint tokens)
     * @custom:requirements Recipient address cannot be zero
     * @custom:requirements Amount must be greater than 0
     * @custom:emits TokensMinted
     * @custom:security No pre-mint or ICO, tokens only created for actual bottle returns
     */
    function mint(address to, uint256 amount) external onlyTracker {
        if (to == address(0)) {
            revert BoutToken__AddressNotCorrect();
        }
        if (amount <= 0) {
            revert BoutToken__AmountNotEnough();
        }
        _mint(to, amount);

        emit TokensMinted(to, amount);
    }

    /**
     * @notice Updates the authorized BoutTracker contract address (admin function)
     * @param _tracker The new BoutTracker contract address
     * @dev Changes which contract can mint tokens via onlyTracker modifier
     * @custom:access onlyOwner
     * @custom:requirements Tracker address cannot be zero
     * @custom:emits TrackerUpdated
     * @custom:security Critical function - only contract owner can change minting permissions
     */
    function setTracker(address _tracker) external onlyOwner {
        if (_tracker == address(0)) {
            revert BoutToken__AddressNotCorrect();
        }
        address oldTracker = tracker;
        tracker = _tracker;

        emit TrackerUpdated(oldTracker, tracker);
    }
}
