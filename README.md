# VotingSystem - Unitary Tests

Projet - Système de vote

Projet #1


  Contract: Voting
  
    Registration Test
   
      ✔ should allow owner to add voters (107ms)
      
      ✔ should not allow non-owner to add voters (1094ms)
      
      ✔ should not allow owner to add the same voter twice (82ms)
      ✔ should not allow owner to add voters when registration is not open (113ms)
      ✔ should not allow owner to add empty address as voter
    Proposal Test
      ✔ should allow voter1 to add a new proposal (183ms)
      ✔ should not add an empty proposal by voter2
      ✔ should not allow non-voters to add proposals - voter3
      ✔ should not add proposals if not in ProposalsRegistrationStarted (192ms)
    Vote Test
      ✔ should allow voter1 to vote  (53ms)
      ✔ should not allow voter2 to vote 
      ✔ should not use invalid proposalID 
      ✔ should not vote twice  (61ms)
      ✔ should not vote if not in VotingSessionStarted (48ms)
    Tally Test
      ✔ should allow only owner to tally 
      ✔ should not tally if not in VotingSessionEnded State (128ms)
      ✔ should tally correctly (962ms)


  17 passing (10s)


 
