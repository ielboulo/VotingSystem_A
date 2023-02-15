// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.8.2 <0.9.0;
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/access/Ownable.sol";
/**
 * @title Voting
 * @dev a voting system allowing to people registered in a whitelist to vote to proposals
 * getWinner() : allows to get the winning proposalId
 */
contract Voting is Ownable {

    struct Voter {
        bool isRegistered;
        bool hasVoted;
        uint votedProposalId;
        }
    struct Proposal {
        string description;
        uint voteCount;
        }
    enum WorkflowStatus {
        RegisteringVoters,
        ProposalsRegistrationStarted,
        ProposalsRegistrationEnded,
        VotingSessionStarted,
        VotingSessionEnded,
        VotesTallied
        }
    event VoterRegistered(address voterAddress); 
    event WorkflowStatusChange(WorkflowStatus previousStatus, WorkflowStatus newStatus);
    event ProposalRegistered(uint proposalId);
    event Voted (address voter, uint proposalId);

   
    // variables of the contract 
    WorkflowStatus public currentStatus = WorkflowStatus.RegisteringVoters; 
    mapping (address => Voter) public votersWhiteList;
    Proposal[] public proposals ; 
    uint public winningProposalId;

    constructor(){
        // we assume that the admin has also the right to vote 
        votersWhiteList[msg.sender] = Voter(true, false, 0); // add admin to voters WL at contract deployment
    }

    modifier isNotAlreadyRegistered(address _address) {
        require(!votersWhiteList[_address].isRegistered, "Voter is already registered");
        _;
    }
    modifier isAddressRegistered(address _address){
        require(votersWhiteList[_address].isRegistered, "sorry, you are not registered in WL");
        _;
    }
    // Only Admin can register voters ==> onlyOwner
    function registerInWL(address  _address) public isNotAlreadyRegistered(_address) onlyOwner {
        require(currentStatus ==  WorkflowStatus.RegisteringVoters, "Sorry, Registration is closed !");
        votersWhiteList[_address] = Voter(true, false, 0);
        emit VoterRegistered(_address);
    }

    function startProposalRegistration() public onlyOwner {
        require(currentStatus ==  WorkflowStatus.RegisteringVoters, "Sorry, proposal registration not possible yet!");
        currentStatus = WorkflowStatus.ProposalsRegistrationStarted;
        emit WorkflowStatusChange(WorkflowStatus.RegisteringVoters, currentStatus);

    }

    function registerProposal(string memory _description) isAddressRegistered(msg.sender) public {
        require(currentStatus ==  WorkflowStatus.ProposalsRegistrationStarted, "Sorry, you no more can register proposal !");
        Proposal memory input = Proposal(_description, 0);
        proposals.push(input);
        emit ProposalRegistered(proposals.length - 1);  // proposalId value from 0 to proposals.length - 1

    }

    function endProposalRegistration() public onlyOwner {
        require(currentStatus ==  WorkflowStatus.ProposalsRegistrationStarted, "Sorry, you no more can end proposal registration !");
        currentStatus = WorkflowStatus.ProposalsRegistrationEnded;
        emit WorkflowStatusChange(WorkflowStatus.ProposalsRegistrationStarted, currentStatus);
    }

    function startVotingSession() public onlyOwner {
        require(currentStatus ==  WorkflowStatus.ProposalsRegistrationEnded, "Sorry, you cannot start voting session !");
        currentStatus = WorkflowStatus.VotingSessionStarted;
        emit WorkflowStatusChange(WorkflowStatus.ProposalsRegistrationEnded, currentStatus);
    }

    function StartVoting(uint _proposalId) isAddressRegistered(msg.sender) public{
        require(currentStatus ==  WorkflowStatus.VotingSessionStarted, "Sorry, you cannot vote !");
        require(! votersWhiteList[msg.sender].hasVoted, "you have already voted !"); //// isRegistered , hasVoted, votedProposalId
        require(_proposalId < proposals.length, "invalid proposalId"); //proposalId : from 0 to proposals.length() - 1
        proposals[_proposalId].voteCount +=1;
        votersWhiteList[msg.sender].hasVoted = true;
        votersWhiteList[msg.sender].votedProposalId = _proposalId; 
        emit Voted(msg.sender, _proposalId); 
    }

    function endVotingSession() public onlyOwner {
        require(currentStatus ==  WorkflowStatus.VotingSessionStarted, "Sorry, you cannot end voting session !");
        currentStatus = WorkflowStatus.VotingSessionEnded;
        emit WorkflowStatusChange(WorkflowStatus.VotingSessionStarted, currentStatus);
    }

    function countWinningProposalId() public onlyOwner {
        require(currentStatus ==  WorkflowStatus.VotingSessionEnded, "Sorry, you cannot count yet !");
        currentStatus = WorkflowStatus.VotesTallied;

        winningProposalId = 0;
        uint maxCounts = 0;
        for (uint i = 0; i < proposals.length; i++) {
            if(proposals[i].voteCount > maxCounts) {
                maxCounts = proposals[i].voteCount;
                winningProposalId = i; 
            }
        }
    }

    function getWinner() public view returns (uint) { 
        require(currentStatus ==  WorkflowStatus.VotesTallied, "Sorry, Votes not done yet !");
        return winningProposalId;
    }

}
