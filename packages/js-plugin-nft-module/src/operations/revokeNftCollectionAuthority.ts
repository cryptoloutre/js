import { createRevokeCollectionAuthorityInstruction } from '@metaplex-foundation/mpl-token-metadata';
import { ConfirmOptions, PublicKey } from '@solana/web3.js';
import { SendAndConfirmTransactionResponse } from '../../rpcModule';
import { findCollectionAuthorityRecordPda, findMetadataPda } from '../pdas';
import { TransactionBuilder } from '@metaplex-foundation/js-core/utils';
import {
  Operation,
  OperationHandler,
  Program,
  Signer,
  useOperation,
} from '@metaplex-foundation/js-core/types';
import { Metaplex } from '@metaplex-foundation/js-core/Metaplex';

// -----------------
// Operation
// -----------------

const Key = 'RevokeNftCollectionAuthorityOperation' as const;

/**
 * Revokes an existing collection authority.
 *
 * ```ts
 * await metaplex
 *   .nfts()
 *   .revokeCollectionAuthority({ mintAddress, collectionAuthority })
 *   .run();
 * ```
 *
 * @group Operations
 * @category Constructors
 */
export const revokeNftCollectionAuthorityOperation =
  useOperation<RevokeNftCollectionAuthorityOperation>(Key);

/**
 * @group Operations
 * @category Types
 */
export type RevokeNftCollectionAuthorityOperation = Operation<
  typeof Key,
  RevokeNftCollectionAuthorityInput,
  RevokeNftCollectionAuthorityOutput
>;

/**
 * @group Operations
 * @category Inputs
 */
export type RevokeNftCollectionAuthorityInput = {
  /** The address of the mint account. */
  mintAddress: PublicKey;

  /** The address of the collection authority to revoke. */
  collectionAuthority: PublicKey;

  /**
   * An authority that can revoke this collection authority.
   *
   * This can either be the collection's update authority or the delegated
   * collection authority itself (i.e. revoking its own rights).
   */
  revokeAuthority?: Signer;

  /** An optional set of programs that override the registered ones. */
  programs?: Program[];

  /** A set of options to configure how the transaction is sent and confirmed. */
  confirmOptions?: ConfirmOptions;
};

/**
 * @group Operations
 * @category Outputs
 */
export type RevokeNftCollectionAuthorityOutput = {
  /** The blockchain response from sending and confirming the transaction. */
  response: SendAndConfirmTransactionResponse;
};

/**
 * @group Operations
 * @category Handlers
 */
export const revokeNftCollectionAuthorityOperationHandler: OperationHandler<RevokeNftCollectionAuthorityOperation> =
  {
    handle: async (
      operation: RevokeNftCollectionAuthorityOperation,
      metaplex: Metaplex
    ): Promise<RevokeNftCollectionAuthorityOutput> => {
      return revokeNftCollectionAuthorityBuilder(
        metaplex,
        operation.input
      ).sendAndConfirm(metaplex, operation.input.confirmOptions);
    },
  };

// -----------------
// Builder
// -----------------

/**
 * @group Transaction Builders
 * @category Inputs
 */
export type RevokeNftCollectionAuthorityBuilderParams = Omit<
  RevokeNftCollectionAuthorityInput,
  'confirmOptions'
> & {
  /** A key to distinguish the instruction that revokes the collection authority. */
  instructionKey?: string;
};

/**
 * Revokes an existing collection authority.
 *
 * ```ts
 * const transactionBuilder = metaplex
 *   .nfts()
 *   .builders()
 *   .revokeCollectionAuthority({ mintAddress, collectionAuthority });
 * ```
 *
 * @group Transaction Builders
 * @category Constructors
 */
export const revokeNftCollectionAuthorityBuilder = (
  metaplex: Metaplex,
  params: RevokeNftCollectionAuthorityBuilderParams
): TransactionBuilder => {
  const {
    mintAddress,
    collectionAuthority,
    revokeAuthority = metaplex.identity(),
    programs,
  } = params;

  const tokenMetadataProgram = metaplex.programs().getTokenMetadata(programs);
  const metadata = findMetadataPda(mintAddress);
  const collectionAuthorityRecord = findCollectionAuthorityRecordPda(
    mintAddress,
    collectionAuthority
  );

  const instruction = createRevokeCollectionAuthorityInstruction(
    {
      collectionAuthorityRecord,
      delegateAuthority: collectionAuthority,
      revokeAuthority: revokeAuthority.publicKey,
      metadata,
      mint: mintAddress,
    },
    tokenMetadataProgram.address
  );

  // Temporary fix. The Shank macro wrongfully ask for the delegateAuthority to be a signer.
  // https://github.com/metaplex-foundation/metaplex-program-library/pull/639
  instruction.keys[1].isSigner = false;

  return (
    TransactionBuilder.make()

      // Revoke the collection authority.
      .add({
        instruction,
        signers: [revokeAuthority],
        key: params.instructionKey ?? 'revokeCollectionAuthority',
      })
  );
};