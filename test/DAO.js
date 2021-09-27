const { expectRevert, Time } = require('@openzeppelin/test-helpers')
const DAO = artifacts.require('DAO')

contract("DAO", (accounts) => {
    let dao = null;

    const [investor1, investor2, investor3] = [account[1], account[2], account[3]]
    beforeEach(async () => {
        dao = await DAO.new(2,2, 50)
    })

    it('Should accept contribution', async() => {
        await dao.contribute({from: investor1, value: 100})
        await dao.contribute({from: investor2, value: 200})
        await dao.contribute({from: investor3, value: 300})

        const shares1 = await dao.shares(investor1)
        const shares2 = await dao.shares(investor2)
        const shares3 = await dao.shares(investor3)
        const isInvestor1 = await dao.investors(investor1)
        const isInvestor2 = await dao.investors(investor2)
        const isInvestor3 = await dao.investors(investor3)
        const totalShares = await dao.totalShare()
        const availableFunds = await dao.availableFunds()

        assert(share1.toNumber() === 100)
        assert(share2.toNumber() === 200)
        assert(share3.toNumber() === 300)
        assert(isInvestor1 === true)
        assert(isInvestor2 === true)
        assert(isInvestor3 === true)
        assert(totalShare.toNumber() === 600)
        assert(availableFunds.toNumber() === 600)
    })

    it('Should NOT accept contribution after contribution time', async () => {
        await time.increase(2001)
        await expectRevert(
            dao.contribute({from: investor1, value: 100}),
            'cannot contribute after contributionEnd'
        )
    })

    it('Should create proposal', async () => {
        await dao.createProposal('Proposal 1', 100, accounts[1], {from: investor1})
        const proposal = await dao.proposals(0)
        assert(proposal.name === 'Proposal 1')
        assert(proposal.recipient === accounts[3])
        assert(proposal.amount.toNumber() === 100)
        assert(proposal.votes.toNumber() === 0)
        assert(proposal.executed === false)
    })

    it('Should NOT create proposal if not from investor', async () => {
        await expectRevert(
            dao.createProposal('Proposal 2', 10, accounts[0], {from: accounts[5]}),
            'only investors'
        )
    })

    it('Should NOT create proposal if amount is too big', async () => {
        await expectRevert(
            dao.createProposal('Proposal 2', 1000, accounts[0], {from: investor1}),
            'amount too big'
        )
    })
})