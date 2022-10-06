import { createRevokeInstruction } from '@solana/spl-token';
import { ConfirmOptions, PublicKey } from '@solana/web3.js';
import { SendAndConfirmTransactionResponse } from '../../../../../js-plugin-rpc-module/src';
import { Metaplex } from '@metaplex-foundation/js-core/Metaplex';
import {
  isSigner,
  KeypairSigner,
  Operation,
  OperationHandler,
  Program,
  Signer,
  useOperation,
} from '@metaplex-foundation/js-core/types';
import { TransactionBuilder } from '@metaplex-foundation/js-core/utils';

// -----------------
// Operation
// -----------------

const Key = 'RevokeTokenDelegateAuthorityOperation' as const;

/**
 * Revokes the current delegate authority for a token account.
 *
 * ```ts
 * await metaplex
 *   .tokens()
 *   .revokeDelegateAuthority({ mintAddress })
 *   .run();
 * ```
 *
 * @group Operations
 * @category Constructors
 */
export const revokeTokenDelegateAuthorityOperation =
  useOperation<RevokeTokenDelegateAuthorityOperation>(Key);

/**
 * @group Operations
 * @category Types
 */
export type RevokeTokenDelegateAuthorityOperation = Operation<
  typeof Key,
  RevokeTokenDelegateAuthorityInput,
  RevokeTokenDelegateAuthorityOutput
>;

/**
 * @group Operations
 * @category Inputs
 */
export type RevokeTokenDelegateAuthorityInput = {
  mintAddress: PublicKey;

  /**
   * The owner of the token account as a Signer.
   *
   * This may be provided as a PublicKey if and only if
   * the `multiSigners` parameter is provided.
   *
   * @defaultValue `metaplex.identity()`
   */
  owner?: Signer | PublicKey;

  /**
   * The address of the token account.
   *
   * @defaultValue Defaults to using the associated token account
   * from the `mintAddress` and `owner` parameters.
   */
  tokenAddress?: PublicKey;

  /**
   * The signing accounts to use if the token owner is a multisig.
   *
   * @defaultValue `[]`
   */
  multiSigners?: KeypairSigner[];

  /** An optional set of programs that override the registered ones. */
  programs?: Program[];

  /** A set of options to configure how the transaction is sent and confirmed. */
  confirmOptions?: ConfirmOptions;
};

/**
 * @group Operations
 * @category Outputs
 */
export type RevokeTokenDelegateAuthorityOutput = {
  /** The blockchain response from sending and confirming the transaction. */
  response: SendAndConfirmTransactionResponse;
};

/**
 * @group Operations
 * @category Handlers
 */
export const revokeTokenDelegateAuthorityOperationHandler: OperationHandler<RevokeTokenDelegateAuthorityOperation> =
  {
    handle: async (
      operation: RevokeTokenDelegateAuthorityOperation,
      metaplex: Metaplex
    ): Promise<RevokeTokenDelegateAuthorityOutput> => {
      return revokeTokenDelegateAuthorityBuilder(
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
export type RevokeTokenDelegateAuthorityBuilderParams = Omit<
  RevokeTokenDelegateAuthorityInput,
  'confirmOptions'
> & {
  /** A key to distinguish the instruction that revokes the delegated authority. */
  instructionKey?: string;
};

/**
 * Revokes the current delegate authority for a token account.
 *
 * ```ts
 * await metaplex
 *   .tokens()
 *   .builders()
 *   .revokeDelegateAuthority({ mintAddress });
 * ```
 *
 * @group Transaction Builders
 * @category Constructors
 */
export const revokeTokenDelegateAuthorityBuilder = (
  metaplex: Metaplex,
  params: RevokeTokenDelegateAuthorityBuilderParams
): TransactionBuilder => {
  const {
    mintAddress,
    owner = metaplex.identity(),
    tokenAddress,
    multiSigners = [],
    programs,
  } = params;

  const [ownerPublicKey, signers] = isSigner(owner)
    ? [owner.publicKey, [owner]]
    : [owner, multiSigners];

  const tokenProgram = metaplex.programs().getToken(programs);
  const tokenAccount =
    tokenAddress ??
    metaplex.tokens().pdas().associatedTokenAccount({
      mint: mintAddress,
      owner: ownerPublicKey,
      programs,
    });

  return TransactionBuilder.make().add({
    instruction: createRevokeInstruction(
      tokenAccount,
      ownerPublicKey,
      multiSigners,
      tokenProgram.address
    ),
    signers,
    key: params.instructionKey ?? 'revokeDelegateAuthority',
  });
};