use anchor_lang::prelude::*;
use anchor_lang::solana_program::{
    instruction::{AccountMeta, Instruction},
    program::invoke_signed,
    system_program,
};
use anchor_spl::token::spl_token;
use anchor_spl::token::spl_token::instruction::TokenInstruction;
use sha2::{Digest, Sha256};

use crate::constants::WALLET_SEED;
use crate::error::TavsinError;
use crate::state::ExecutionRequest;

pub fn hash_instruction_data(data: &[u8]) -> [u8; 32] {
    let mut hasher = Sha256::new();
    hasher.update(data);
    hasher.finalize().into()
}

pub fn hash_account_infos(accounts: &[AccountInfo<'_>]) -> [u8; 32] {
    let mut encoded = Vec::with_capacity(accounts.len() * 34);
    for account in accounts {
        encoded.extend_from_slice(account.key.as_ref());
        encoded.push(u8::from(account.is_writable));
        encoded.push(u8::from(account.is_signer));
    }

    let mut hasher = Sha256::new();
    hasher.update(&encoded);
    hasher.finalize().into()
}

pub fn verify_request_payload(
    expected_instruction_hash: [u8; 32],
    expected_accounts_hash: [u8; 32],
    instruction_data: &[u8],
    remaining_accounts: &[AccountInfo<'_>],
) -> Result<()> {
    require!(
        hash_instruction_data(instruction_data) == expected_instruction_hash,
        TavsinError::RequestInstructionHashMismatch
    );
    require!(
        hash_account_infos(remaining_accounts) == expected_accounts_hash,
        TavsinError::RequestAccountsHashMismatch
    );
    Ok(())
}

pub fn validate_execution_preflight(
    wallet_key: Pubkey,
    request: &ExecutionRequest,
    remaining_accounts: &[AccountInfo<'_>],
    instruction_data: &[u8],
) -> Result<bool> {
    if request.target_program == system_program::ID {
        require!(request.asset_mint == Pubkey::default(), TavsinError::UnsupportedAssetExecution);
        require!(remaining_accounts.is_empty(), TavsinError::InvalidExecutionAccounts);
        require!(instruction_data.is_empty(), TavsinError::InvalidExecutionPayload);
        return Ok(true);
    }

    if request.target_program == spl_token::ID {
        require!(request.asset_mint != Pubkey::default(), TavsinError::UnsupportedAssetExecution);
        require!(remaining_accounts.len() >= 4, TavsinError::InvalidExecutionAccounts);
        require!(remaining_accounts[1].key() == request.asset_mint, TavsinError::InvalidExecutionAccounts);
        require!(remaining_accounts[2].key() == request.recipient, TavsinError::InvalidExecutionAccounts);
        require!(remaining_accounts[3].key() == wallet_key, TavsinError::InvalidExecutionAccounts);

        match TokenInstruction::unpack(instruction_data)
            .map_err(|_| error!(TavsinError::InvalidExecutionPayload))?
        {
            TokenInstruction::TransferChecked { amount, .. } => {
                require!(amount == request.amount, TavsinError::InvalidExecutionPayload);
            }
            _ => return err!(TavsinError::InvalidExecutionPayload),
        }

        return Ok(false);
    }

    require!(!remaining_accounts.is_empty(), TavsinError::InvalidExecutionAccounts);
    require!(
        remaining_accounts.iter().any(|account| account.key() == request.recipient),
        TavsinError::InvalidExecutionAccounts
    );
    require!(
        remaining_accounts.iter().any(|account| account.key() == wallet_key),
        TavsinError::InvalidExecutionAccounts
    );
    require!(!instruction_data.is_empty(), TavsinError::InvalidExecutionPayload);

    Ok(false)
}

pub fn invoke_wallet_signed<'info>(
    wallet_key: Pubkey,
    wallet_owner: Pubkey,
    wallet_agent: Pubkey,
    wallet_bump: u8,
    program_id: Pubkey,
    remaining_accounts: &[AccountInfo<'info>],
    instruction_data: Vec<u8>,
) -> Result<()> {
    let metas = remaining_accounts
        .iter()
        .map(|account| {
            let is_wallet_signer = account.key() == wallet_key;
            if account.is_writable {
                AccountMeta::new(account.key(), account.is_signer || is_wallet_signer)
            } else {
                AccountMeta::new_readonly(account.key(), account.is_signer || is_wallet_signer)
            }
        })
        .collect::<Vec<_>>();

    let instruction = Instruction {
        program_id,
        accounts: metas,
        data: instruction_data,
    };

    let infos = remaining_accounts.to_vec();
    let bump = [wallet_bump];
    let signer_seeds: &[&[u8]] = &[WALLET_SEED, wallet_owner.as_ref(), wallet_agent.as_ref(), &bump];

    invoke_signed(&instruction, &infos, &[signer_seeds])?;
    Ok(())
}