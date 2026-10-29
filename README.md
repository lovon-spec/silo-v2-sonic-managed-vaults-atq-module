# Legacy Silo managed vaults on Sonic

This module emits managed ERC-4626 vault contracts from Silo Finance's legacy Sonic source, chain146. These are the managed vaults that can allocate deposits across isolated Silo lending markets, distinct from the lending vaults themselves. Each managed vault is also its ERC-20 share token.

## Specific source documentation

Silo Finance's own [snapshot documentation](https://github.com/silo-finance/lenders-snapshot/blob/58dbfc612906307137c305d56adf9f1a7ea61dce/scripts/lender-snapshot/README.md)
describes the `subgraph_url` configuration and identifies `snapshot_lenders.py`
as its canonical configuration. That [documented configuration](https://github.com/silo-finance/lenders-snapshot/blob/58dbfc612906307137c305d56adf9f1a7ea61dce/scripts/lender-snapshot/snapshot_lenders.py)
explicitly selects Sonic's subgraph
`8wcbzcdNirQvk1ETh25wpVzb5GWs8DvugpbwrYnTCcxj`. This is a reference to that
specific subgraph, without inferring authorization for other publications by
the same address. The project also identifies these chain endpoints as legacy
V2 sources in its [borrower tooling](https://github.com/silo-finance/actions/blob/0e0a4f79772a176846e181483d1f22adf5b26948/scripts/pull_borrowers/fetch_legacy_borrowers.py).

The [named subgraph](https://thegraph.com/explorer/subgraphs/8wcbzcdNirQvk1ETh25wpVzb5GWs8DvugpbwrYnTCcxj?chain=arbitrum-one&view=About)
resolved on 2026-10-28 to deployment
`QmQUcPAEpUQJL3AYK21hsgNnj6XmWepTXJXySHdFXMmp7p`. The module queries that
explicit deployment through The Graph gateway, with the supplied key only in
the authorization header. Recheck the named source before filing an item.

The protocol documents the contract category in its [Silo Vaults introduction](https://docs.silo.finance/docs/vaults/intro/). Deployment is permissionless; identifying a Silo vault does not claim that Silo Finance endorses its manager or that the market is currently listed or usable in the UI.

## Retrieval and names

All Vault rows are retrieved at one pinned block hash, with an unfiltered first page and complete ascending unique-address-ID cursor pagination. A final metadata seal binds the source snapshot. Errors, unhealthy metadata, invalid identities and unfinished pagination throw. A page budget throws rather than returning partial output.

Names use the published vault name with a protocol prefix. Empty or unsafe name metadata uses the full contract address. Long names use the ellipsis convention. Name collisions use the complete emitted address. Every vault is retained; no fake instance number or source filter is introduced. Notes identify the contract role, underlying asset and share decimals without an endorsement.

Use Yarn and yarn build. All logic is in src/main.mts, exporting only async returnTags with two string arguments. MIT licensed, authored from our own original Silo V2 module.

Factory deployment history is listed in the project's [deployed-contracts documentation](https://github.com/silo-finance/silo-contracts-v3/blob/ed18f3a33be1a08e786279c50b914b1d6eaf04c7/silo-core/docs/DeployedSiloVersions.md), in the Sonic subsection under Vault factories ever deployed. This distinguishes production factories from deployment artifacts belonging to other versions or tests.

Each query, including pacing and the response-body read, has a 30-second deadline. The complete run has a ten-minute deadline. A deadline throws without returning a partial set; native fetch cancellation is requested, and the local race also bounds fetch implementations that ignore cancellation. Use yarn build and yarn test.
