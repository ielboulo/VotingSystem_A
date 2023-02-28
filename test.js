const Voting = artifacts.require("./Voting.sol");
const { BN , expectRevert, expectEvent } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');

contract("Voting", accounts => {
  const owner = accounts[0];
  const voter1 = accounts[1];
  const voter2 = accounts[2];
  const voter3 = accounts[3];
  const voter4 = accounts[4];

  describe("Registration Test", () => {
    let votingInstance;

    beforeEach(async () => {
      votingInstance = await Voting.new({ from: owner });
    });

    it("should allow owner to add voters", async () => {
      votingInstance.workflowStatus = Voting.WorkflowStatus.RegisteringVoters;
      const { logs } = await votingInstance.addVoter(voter1, { from: owner });

      assert.equal(logs[0].event, "VoterRegistered", "VoterRegistered event should be emitted");
      assert.equal(logs[0].args.voterAddress, voter1, "Event should have the correct voter address");  

      const newVoter = await votingInstance.getVoter.call(voter1, { from: voter1 }); // { from: voter1 } : this helps to initialize msg.sender
      assert.isTrue(newVoter.isRegistered, "Voter should be registered");
    });

    it("should not allow non-owner to add voters", async () => {
      votingInstance.workflowStatus = Voting.WorkflowStatus.RegisteringVoters;
      await expectRevert(votingInstance.addVoter(voter1, { from: voter2 }),
        "Ownable: caller is not the owner");
    });

    it("should not allow owner to add the same voter twice", async () => {
      await votingInstance.addVoter(voter1, { from: owner });
      await expectRevert(votingInstance.addVoter(voter1, { from: owner }),
        "Already registered");
    });

    it("should not allow owner to add voters when registration is not open", async () => {

      //votingInstance.workflowStatus = Voting.WorkflowStatus.VotesTallied; //==> this code line had no effect. I had to define set and get functions setWorkflowStatus / getWorkflowStatus in voting.sol
      await votingInstance.setWorkflowStatus(Voting.WorkflowStatus.VotesTallied, { from: owner });
      const workflowStatus = await votingInstance.getWorkflowStatus();
      assert.equal(workflowStatus, Voting.WorkflowStatus.VotesTallied);
    
      await expectRevert(
        votingInstance.addVoter(voter4, { from: owner }),
        "Voters registration is not open yet");
      });
      // TDD :-) =>  the code wasn't expecting this use case , we should enhance Voting.sol with checking invalid address. 
      it("should not allow owner to add empty address as voter", async () => {
        await expectRevert(
          votingInstance.addVoter("0x0000000000000000000000000000000000000000", { from: owner }),
          "Voters cant have invalid address"
        );
      });
  }); // fin describe


describe("Proposal Test", () => {
  let votingInstance_2;

  beforeEach(async () => {
    votingInstance_2 = await Voting.new({ from: owner });
    await votingInstance_2.setWorkflowStatus(Voting.WorkflowStatus.RegisteringVoters, { from: owner });
    await votingInstance_2.addVoter(voter1, { from: owner });
    await votingInstance_2.addVoter(voter2, { from: owner });
    await votingInstance_2.setWorkflowStatus(Voting.WorkflowStatus.ProposalsRegistrationStarted, { from: owner });
  });

  it("should allow voter1 to add a new proposal", async () => {
    const proposal = "Proposal 1";
    const { logs } = await votingInstance_2.addProposal(proposal, { from: voter1 });
  
    // check proposal added event
    proposalVoteCount = new BN(0);
    assert.equal(logs[0].event, "ProposalRegistered", "ProposalRegistered event should be emitted");
    expect(logs[0].args.proposalId).to.be.bignumber.equal(proposalVoteCount);
  
    // check proposal data
    const proposalData = await votingInstance_2.getOneProposal.call(new BN(0), { from: voter1 });
    assert.equal(proposalData.description, proposal, "Proposal should be " + proposal);
    expect(proposalData.voteCount).to.be.bignumber.equal(proposalVoteCount);

  });


  it("should not add an empty proposal by voter2", async () => {
    proposal_empty = "";
    await expectRevert(
      votingInstance_2.addProposal(proposal_empty, { from: voter2 }), 
      "Vous ne pouvez pas ne rien proposer");
  });

  it("should not allow non-voters to add proposals - voter3", async () => {
    const proposal3 = "Proposal 3";
    await expectRevert(
      votingInstance_2.addProposal(proposal3, { from: voter4 }),
      "You're not a voter");
  });

  it("should not add proposals if not in ProposalsRegistrationStarted", async () => {
    const proposal1 = "Proposal 1";
    await votingInstance_2.setWorkflowStatus(Voting.WorkflowStatus.RegisteringVoters, { from: owner });

    await expectRevert(
      votingInstance_2.addProposal(proposal1, { from: voter1 }), // voter1 is already registered
      "Proposals are not allowed yet");
  });

});// fin describe


describe("Vote Test", () => {
  let votingInstance_3;

  beforeEach(async () => {
    votingInstance_3 = await Voting.new({ from: owner });
    await votingInstance_3.setWorkflowStatus(Voting.WorkflowStatus.RegisteringVoters, { from: owner });
    await votingInstance_3.addVoter(voter1, { from: owner });
    await votingInstance_3.setWorkflowStatus(Voting.WorkflowStatus.ProposalsRegistrationStarted, { from: owner });
    await votingInstance_3.addProposal('proposal1', { from: voter1 });
    await votingInstance_3.setWorkflowStatus(Voting.WorkflowStatus.VotingSessionStarted, { from: owner });
  });

  it("should allow voter1 to vote ", async () => {
    const proposalID = new BN(0);
    const { logs } = await votingInstance_3.setVote(proposalID, { from: voter1 });
  
    // check proposal added event //     event Voted (address voter, uint proposalId);
    assert.equal(logs[0].event, "Voted", "Voted event should be emitted");
    expect(logs[0].args.voter).to.equal(voter1);
    expect(logs[0].args.proposalId).to.be.bignumber.equal(proposalID);
  });

  it("should not allow voter2 to vote ", async () => {
    const proposalID = new BN(0);
    await expectRevert(
      votingInstance_3.addProposal(proposalID, { from: voter2 }),
      "You're not a voter");
  });

  it("should not use invalid proposalID ", async () => {
    const proposalID = new BN(10);
    await expectRevert(votingInstance_3.setVote(proposalID, { from: voter1 }),
      "Proposal not found");
  });

  it("should not vote twice ", async () => {
    const proposalID = new BN(0);
    //first vote ok
    const { logs } = await votingInstance_3.setVote(proposalID, { from: voter1 });
    assert.equal(logs[0].event, "Voted", "Voted event should be emitted");

    // second vote NOK 
    await await expectRevert(votingInstance_3.setVote(proposalID, { from: voter1 }),
    "You have already voted");
  });

  it("should not vote if not in VotingSessionStarted", async () => {
    const proposal_id = new BN(0);
    await votingInstance_3.setWorkflowStatus(Voting.WorkflowStatus.RegisteringVoters, { from: owner });

    await expectRevert(
      votingInstance_3.setVote(proposal_id, { from: voter1 }), // voter1 is already registered
      "Voting session havent started yet");
  });

});// fin describe


describe("Tally Test", () => {
  let votingInstance_4;
  beforeEach(async () => {
    votingInstance_4 = await Voting.new({ from: owner });
  });

  it("should allow only owner to tally ", async () => {
    await expectRevert(votingInstance_4.tallyVotes( { from: voter1 }), "Ownable: caller is not the owner");
  });

  it("should not tally if not in VotingSessionEnded State", async () => {
    await votingInstance_4.setWorkflowStatus(Voting.WorkflowStatus.RegisteringVoters, { from: owner });
    await expectRevert(votingInstance_4.tallyVotes({ from: owner }),
      "Current status is not voting session ended");
  });

  it("should tally correctly", async () => {
    await votingInstance_4.setWorkflowStatus(Voting.WorkflowStatus.RegisteringVoters, { from: owner });
    await votingInstance_4.addVoter(voter1, { from: owner });
    await votingInstance_4.addVoter(voter2, { from: owner });
    await votingInstance_4.addVoter(voter4, { from: owner });

    await votingInstance_4.setWorkflowStatus(Voting.WorkflowStatus.ProposalsRegistrationStarted, { from: owner });
    await votingInstance_4.addProposal('proposal1', { from: voter1 });
    await votingInstance_4.addProposal('proposal2', { from: voter2 });
    await votingInstance_4.addProposal('proposal3', { from: voter4 });

    await votingInstance_4.setWorkflowStatus(Voting.WorkflowStatus.VotingSessionStarted, { from: owner });
    await votingInstance_4.setVote(new BN(2), { from: voter1 }); // voter 1 votes for proposal3 (index2)
    await votingInstance_4.setVote(new BN(1), { from: voter2 }); // voter 2 votes for proposal2 (index1)
    await votingInstance_4.setVote(new BN(2), { from: voter4 }); // voter 4 votes for proposal3 (index2)

    await votingInstance_4.setWorkflowStatus(Voting.WorkflowStatus.VotingSessionEnded, { from: owner });
    const { logs } = await votingInstance_4.tallyVotes({ from: owner });

    // check the status changed correctly
    assert.equal(logs[0].event, "WorkflowStatusChange", "WorkflowStatusChange event should be emitted");
    expect(logs[0].args.previousStatus).to.be.bignumber.equal(new BN(Voting.WorkflowStatus.VotingSessionEnded));
    expect(logs[0].args.newStatus).to.be.bignumber.equal(new BN(Voting.WorkflowStatus.VotesTallied));

    // check winning ID :
    const wID = await votingInstance_4.getWinnerID();
    expect(wID).to.be.bignumber.equal(new BN(2)); 

  });

});// fin describe

describe("State Change Test", () => {
  let votingInstance_5;
  beforeEach(async () => {
    votingInstance_5 = await Voting.new({ from: owner });
  });

  it("should allow only owner to tally ", async () => {
    await expectRevert(votingInstance_5.startProposalsRegistering( { from: voter1 }), "Ownable: caller is not the owner");
  });

  it("should not change state if not in the right State", async () => {
    await votingInstance_5.setWorkflowStatus(Voting.WorkflowStatus.ProposalsRegistrationStarted, { from: owner });
    await expectRevert(votingInstance_5.startProposalsRegistering({ from: owner }),
      "Registering proposals cant be started now");
  });

  it("should change to next state if is in the right State + check event ", async () => {
    await votingInstance_5.setWorkflowStatus(Voting.WorkflowStatus.RegisteringVoters, { from: owner });
    const receipt = await votingInstance_5.startProposalsRegistering({ from: owner });
    expectEvent(receipt, 'WorkflowStatusChange', {
      previousStatus: new BN(Voting.WorkflowStatus.RegisteringVoters),
      newStatus: new BN(Voting.WorkflowStatus.ProposalsRegistrationStarted),
    });
  });

});// fin describe
  
});// fin contract
