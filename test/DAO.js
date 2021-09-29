const { expectRevert, time } = require('@openzeppelin/test-helpers')
const DAO = artifacts.require('DAO')

contract("DAO", (accounts) => {
    let dao = null;

    beforeEach(async () => {
        dao = await DAO.new(2,2, 50)
    })

    it('Should accept contribution', async() => {
        await dao.contribute({from: accounts[1], value: 100})
        await dao.contribute({from: accounts[2], value: 200})
        await dao.contribute({from: accounts[3], value: 300})

        const shares1 = await dao.shares(accounts[1])
        const shares2 = await dao.shares(accounts[2])
        const shares3 = await dao.shares(accounts[3])
        const isInvestor1 = await dao.investors(accounts[1])
        const isInvestor2 = await dao.investors(accounts[2])
        const isInvestor3 = await dao.investors(accounts[3])
        const totalShares = await dao.totalShare()
        const availableFunds = await dao.availableFunds()

        console.log(shares1.toNumber())
        console.log(shares2.toNumber())
        console.log(shares3.toNumber())
        console.log(isInvestor1)
        console.log(isInvestor2)
        console.log(isInvestor3)
        console.log(totalShares.toNumber())
        console.log(availableFunds.toNumber())
        
        assert(shares1.toNumber() === 100)
        assert(shares2.toNumber() === 200)
        assert(shares3.toNumber() === 300)
        assert(isInvestor1 === true)
        assert(isInvestor2 === true)
        assert(isInvestor3 === true)
        assert(totalShares.toNumber() === 600)
        assert(availableFunds.toNumber() === 600)
    })

    it('Should NOT accept contribution after contribution time', async () => {
        await time.increase(2001)
        await expectRevert(
            dao.contribute({from: accounts[1], value: 100}),
            'cannot contribute after contributionEnd'
        )
    })

    it('Should create proposal', async () => {
        await dao.createProposal('Proposal 1', 100, accounts[1], {from: accounts[1]})
        const proposal = await dao.proposals(0)
        assert(proposal.name === 'Proposal 1')
        assert(proposal.recipient === accounts[8])
        assert(proposal.amount.toNumber() === 100)
        assert(proposal.votes.toNumber() === 0)
        assert(proposal.executed === false)
    })

    it('Should NOT create proposal if not from investor', async () => {
        await expectRevert(
            dao.createProposal('Proposal 2', 10, accounts[8], {from: accounts[5]}),
            'only investors'
        )
    })

    it('Should NOT create proposal if amount is too big', async () => {
        await expectRevert(
            dao.createProposal('Proposal 2', 1000, accounts[8], {from: accounts[1]}),
            'amount too big'
        )
    })

    it('Should vote', async () => {
        await dao.vote(0, {from: accounts[1]})
    })

    it('Should NOT vote if not investor', async () => {
        await expectRevert(
            dao.vote(0, {from: accounts[1]}),
            'only investors'
        )
    })

    it('Should NOT vote if already voted', async () => {
        await time.increase(2001)
        expectRevert(
            dao.vote(0, { from: accounts[1]}),
            'investor can only vote once for a proposal'
        )
    })
    it('Should NOT vote if after proposal end date', async () => {
        await time.increase(2001)
        expectRevert(
            dao.vote(0, { from: accounts[1]}),
            'can only vote until proposal end'
        )
    })

    it('Should execute proposal', async () => {
        await dao.createProposal('Proposal 2', 100, accounts[0], {from: accounts[1]})
        await dao.vote(1, { from: accounts[1]})
        await dao.vote(1, { from: investor3})
        await time.increase(2001)
        await dao.executeProposal(1)
    })

    it('Should NOT execute proposal if not enough votes', async () => {
        await dao.createProposal('Proposal 3', 100, accounts[0], {from: accounts[1]})
        await dao.vote(2, {from: accounts[1]})
        await time.increase(2001)
        await expectRevert(
            dao.executeProposal(2),
            'cannot execute a proposal with votes below quorum'
        )
    })

    it('Should NOT execute proposal twice', async () => {
        await expectRevert(
            dao.executeProposal(1),
            'cannot execute a proposal already executed'
        )
    })

    it('Should NOT execute proposal before end date', async () => {
        await dao.createProposal('Proposal 4', 50, accounts[0], {from: accounts[1]})
        await dao.vote(3, {from: accounts[1]})
        await dao.vote(3, {from: accounts[1]})
        expectRevert(
            dao.executeProposal(3),
            'cannot execute a proposal before end date'
        )
    })

    it('Should withdraw ether', async () => {
        const balanceBefore = await web3.eth.getBalance(accounts[8])
        await dao.withdrawEther(10, accounts[8])
        const balanceAfter = await web3.eth.getBalance(accounts[8])
        balanceAfterBN = web3.utils.toBN(balanceAfter)
        balanceBeforeBN = web3.utils.toBN(balanceBefore)
        assert(balanceAfterBN.sub(balanceBeforeBN).toNumber() === 10)
    })

    it('Should NOT withdraw ether if not admin', async () => {
        await expectRevert(
            dao.withdrawEther(10, accounts[8], { from: accounts[1]}),
            'only admin'
        )
    })

    it('Should NOT withdraw ether if trying to withdraw too much', async () => {
        await expectRevert(
            dao.withdrawEther(10, accounts[8], { from: accounts[1]}),
            'not enough availableFunds'
        ) 
    })
})      