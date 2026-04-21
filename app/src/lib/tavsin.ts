/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/tavsin.json`.
 */
export type Tavsin = {
  "address": "2VzG2545ksX8cUSggRxQ6DUpDdFb1q9vkZwFftvWcbFy",
  "metadata": {
    "name": "tavsin",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Policy-enforced smart wallet for AI agents on Solana"
  },
  "instructions": [
    {
      "name": "approveRequest",
      "discriminator": [
        89,
        68,
        167,
        104,
        93,
        25,
        178,
        205
      ],
      "accounts": [
        {
          "name": "owner",
          "writable": true,
          "signer": true
        },
        {
          "name": "wallet",
          "writable": true
        },
        {
          "name": "request",
          "writable": true
        },
        {
          "name": "auditEntry",
          "writable": true
        },
        {
          "name": "systemProgram"
        }
      ],
      "args": []
    },
    {
      "name": "createWallet",
      "discriminator": [
        82,
        172,
        128,
        18,
        161,
        207,
        88,
        63
      ],
      "accounts": [
        {
          "name": "owner",
          "docs": [
            "The human owner creating the wallet."
          ],
          "writable": true,
          "signer": true
        },
        {
          "name": "agent",
          "docs": [
            "The agent's public key (not a signer — just an identifier)."
          ]
        },
        {
          "name": "wallet",
          "docs": [
            "The smart wallet PDA."
          ],
          "writable": true
        },
        {
          "name": "policy",
          "docs": [
            "The policy PDA tied to this wallet."
          ],
          "writable": true
        },
        {
          "name": "tracker",
          "docs": [
            "The spend tracker PDA tied to this wallet."
          ],
          "writable": true
        },
        {
          "name": "systemProgram"
        }
      ],
      "args": [
        {
          "name": "maxPerTx",
          "type": "u64"
        },
        {
          "name": "maxDaily",
          "type": "u64"
        },
        {
          "name": "allowedPrograms",
          "type": {
            "vec": "pubkey"
          }
        },
        {
          "name": "timeWindowStart",
          "type": {
            "option": "i64"
          }
        },
        {
          "name": "timeWindowEnd",
          "type": {
            "option": "i64"
          }
        }
      ]
    },
    {
      "name": "execute",
      "discriminator": [
        130,
        221,
        242,
        154,
        13,
        193,
        189,
        29
      ],
      "accounts": [
        {
          "name": "agent",
          "docs": [
            "The AI agent requesting the transaction."
          ],
          "writable": true,
          "signer": true
        },
        {
          "name": "wallet",
          "docs": [
            "The smart wallet PDA (source of funds)."
          ],
          "writable": true
        },
        {
          "name": "policy",
          "docs": [
            "The policy governing this wallet."
          ]
        },
        {
          "name": "tracker",
          "docs": [
            "The spend tracker for budget enforcement."
          ],
          "writable": true
        },
        {
          "name": "assetTracker",
          "docs": [
            "The asset-specific spend tracker for native SOL (Pubkey::default())."
          ],
          "writable": true
        },
        {
          "name": "auditEntry",
          "docs": [
            "The audit entry PDA for this transaction."
          ],
          "writable": true
        },
        {
          "name": "recipient",
          "docs": [
            "The recipient of the SOL transfer."
          ],
          "writable": true
        },
        {
          "name": "targetProgram",
          "docs": [
            "The target program the agent wants to interact with (for allowlist checking)."
          ]
        },
        {
          "name": "systemProgram"
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        },
        {
          "name": "memo",
          "type": "string"
        }
      ]
    },
    {
      "name": "executeRequest",
      "discriminator": [
        113,
        254,
        117,
        135,
        26,
        14,
        232,
        88
      ],
      "accounts": [
        {
          "name": "agent",
          "writable": true,
          "signer": true
        },
        {
          "name": "wallet",
          "writable": true
        },
        {
          "name": "policy"
        },
        {
          "name": "assetTracker",
          "writable": true
        },
        {
          "name": "request",
          "writable": true
        },
        {
          "name": "auditEntry",
          "writable": true
        },
        {
          "name": "targetProgram"
        },
        {
          "name": "recipient",
          "writable": true
        },
        {
          "name": "systemProgram"
        }
      ],
      "args": []
    },
    {
      "name": "executeRequestWithPayload",
      "discriminator": [
        180,
        250,
        57,
        84,
        252,
        161,
        172,
        53
      ],
      "accounts": [
        {
          "name": "agent",
          "writable": true,
          "signer": true
        },
        {
          "name": "wallet",
          "writable": true
        },
        {
          "name": "policy"
        },
        {
          "name": "assetTracker",
          "writable": true
        },
        {
          "name": "request",
          "writable": true
        },
        {
          "name": "auditEntry",
          "writable": true
        },
        {
          "name": "targetProgram"
        },
        {
          "name": "recipient",
          "writable": true
        },
        {
          "name": "systemProgram"
        }
      ],
      "args": [
        {
          "name": "instructionData",
          "type": "bytes"
        }
      ]
    },
    {
      "name": "freezeWallet",
      "discriminator": [
        93,
        202,
        159,
        167,
        22,
        246,
        255,
        211
      ],
      "accounts": [
        {
          "name": "owner",
          "signer": true
        },
        {
          "name": "wallet",
          "writable": true
        }
      ],
      "args": []
    },
    {
      "name": "fundWallet",
      "discriminator": [
        211,
        148,
        179,
        170,
        52,
        18,
        154,
        0
      ],
      "accounts": [
        {
          "name": "owner",
          "docs": [
            "The owner funding the wallet."
          ],
          "writable": true,
          "signer": true
        },
        {
          "name": "wallet",
          "docs": [
            "The smart wallet PDA to fund."
          ],
          "writable": true
        },
        {
          "name": "systemProgram"
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "rejectRequest",
      "discriminator": [
        11,
        232,
        75,
        149,
        197,
        137,
        152,
        208
      ],
      "accounts": [
        {
          "name": "owner",
          "writable": true,
          "signer": true
        },
        {
          "name": "wallet",
          "writable": true
        },
        {
          "name": "request",
          "writable": true
        },
        {
          "name": "auditEntry",
          "writable": true
        },
        {
          "name": "systemProgram"
        }
      ],
      "args": []
    },
    {
      "name": "submitRequest",
      "discriminator": [
        122,
        30,
        180,
        251,
        206,
        230,
        254,
        57
      ],
      "accounts": [
        {
          "name": "agent",
          "writable": true,
          "signer": true
        },
        {
          "name": "wallet",
          "writable": true
        },
        {
          "name": "policy"
        },
        {
          "name": "request",
          "writable": true
        },
        {
          "name": "auditEntry",
          "writable": true
        },
        {
          "name": "recipient"
        },
        {
          "name": "assetMint"
        },
        {
          "name": "assetTracker",
          "writable": true
        },
        {
          "name": "counterpartyPolicy",
          "optional": true
        },
        {
          "name": "targetProgram"
        },
        {
          "name": "systemProgram"
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        },
        {
          "name": "memo",
          "type": "string"
        },
        {
          "name": "instructionHash",
          "type": {
            "array": [
              "u8",
              32
            ]
          }
        },
        {
          "name": "accountsHash",
          "type": {
            "array": [
              "u8",
              32
            ]
          }
        },
        {
          "name": "expiresAt",
          "type": {
            "option": "i64"
          }
        }
      ]
    },
    {
      "name": "unfreezeWallet",
      "discriminator": [
        246,
        148,
        196,
        60,
        209,
        142,
        99,
        68
      ],
      "accounts": [
        {
          "name": "owner",
          "signer": true
        },
        {
          "name": "wallet",
          "writable": true
        }
      ],
      "args": []
    },
    {
      "name": "updatePolicy",
      "discriminator": [
        212,
        245,
        246,
        7,
        163,
        151,
        18,
        57
      ],
      "accounts": [
        {
          "name": "owner",
          "signer": true
        },
        {
          "name": "wallet"
        },
        {
          "name": "policy",
          "writable": true
        }
      ],
      "args": [
        {
          "name": "maxPerTx",
          "type": {
            "option": "u64"
          }
        },
        {
          "name": "maxDaily",
          "type": {
            "option": "u64"
          }
        },
        {
          "name": "approvalThreshold",
          "type": {
            "option": "u64"
          }
        },
        {
          "name": "requireApprovalForNewRecipients",
          "type": {
            "option": "bool"
          }
        },
        {
          "name": "allowedPrograms",
          "type": {
            "option": {
              "vec": "pubkey"
            }
          }
        },
        {
          "name": "allowedRecipients",
          "type": {
            "option": {
              "vec": "pubkey"
            }
          }
        },
        {
          "name": "blockedMints",
          "type": {
            "option": {
              "vec": "pubkey"
            }
          }
        },
        {
          "name": "mintRules",
          "type": {
            "option": {
              "vec": {
                "defined": {
                  "name": "mintRule"
                }
              }
            }
          }
        },
        {
          "name": "timeWindowStart",
          "type": {
            "option": "i64"
          }
        },
        {
          "name": "timeWindowEnd",
          "type": {
            "option": "i64"
          }
        },
        {
          "name": "clearTimeWindow",
          "type": {
            "option": "bool"
          }
        },
        {
          "name": "enforceCounterpartyPolicy",
          "type": {
            "option": "bool"
          }
        }
      ]
    },
    {
      "name": "upsertCounterpartyPolicy",
      "discriminator": [
        127,
        98,
        196,
        63,
        79,
        173,
        35,
        223
      ],
      "accounts": [
        {
          "name": "owner",
          "writable": true,
          "signer": true
        },
        {
          "name": "wallet"
        },
        {
          "name": "recipient"
        },
        {
          "name": "counterpartyPolicy",
          "writable": true
        },
        {
          "name": "systemProgram"
        }
      ],
      "args": [
        {
          "name": "enabled",
          "type": "bool"
        },
        {
          "name": "requireApproval",
          "type": "bool"
        },
        {
          "name": "maxPerTxOverride",
          "type": {
            "option": "u64"
          }
        },
        {
          "name": "dailyLimitOverride",
          "type": {
            "option": "u64"
          }
        },
        {
          "name": "allowedMints",
          "type": {
            "vec": "pubkey"
          }
        }
      ]
    },
    {
      "name": "withdraw",
      "discriminator": [
        183,
        18,
        70,
        156,
        148,
        109,
        161,
        34
      ],
      "accounts": [
        {
          "name": "owner",
          "writable": true,
          "signer": true
        },
        {
          "name": "wallet",
          "writable": true
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "assetSpendTracker",
      "discriminator": [
        178,
        223,
        7,
        73,
        56,
        151,
        202,
        169
      ]
    },
    {
      "name": "auditEntry",
      "discriminator": [
        254,
        88,
        234,
        107,
        205,
        16,
        148,
        113
      ]
    },
    {
      "name": "counterpartyPolicy",
      "discriminator": [
        26,
        109,
        252,
        227,
        19,
        119,
        233,
        34
      ]
    },
    {
      "name": "executionRequest",
      "discriminator": [
        88,
        79,
        182,
        197,
        147,
        44,
        123,
        20
      ]
    },
    {
      "name": "policy",
      "discriminator": [
        222,
        135,
        7,
        163,
        235,
        177,
        33,
        68
      ]
    },
    {
      "name": "smartWallet",
      "discriminator": [
        67,
        59,
        220,
        179,
        41,
        10,
        60,
        177
      ]
    },
    {
      "name": "spendTracker",
      "discriminator": [
        180,
        17,
        195,
        180,
        162,
        207,
        239,
        205
      ]
    }
  ],
  "events": [
    {
      "name": "counterpartyPolicyUpserted",
      "discriminator": [
        103,
        84,
        183,
        127,
        29,
        83,
        152,
        28
      ]
    },
    {
      "name": "policyUpdated",
      "discriminator": [
        225,
        112,
        112,
        67,
        95,
        236,
        245,
        161
      ]
    },
    {
      "name": "requestApproved",
      "discriminator": [
        158,
        196,
        69,
        207,
        98,
        44,
        119,
        187
      ]
    },
    {
      "name": "requestDenied",
      "discriminator": [
        21,
        164,
        219,
        5,
        34,
        138,
        199,
        213
      ]
    },
    {
      "name": "requestExecuted",
      "discriminator": [
        254,
        115,
        238,
        135,
        55,
        132,
        6,
        62
      ]
    },
    {
      "name": "requestRejected",
      "discriminator": [
        92,
        222,
        126,
        51,
        111,
        175,
        57,
        199
      ]
    },
    {
      "name": "requestSubmitted",
      "discriminator": [
        113,
        213,
        202,
        246,
        213,
        106,
        73,
        44
      ]
    },
    {
      "name": "walletCreated",
      "discriminator": [
        159,
        189,
        177,
        30,
        192,
        157,
        229,
        179
      ]
    },
    {
      "name": "walletFrozen",
      "discriminator": [
        193,
        14,
        205,
        91,
        1,
        121,
        55,
        77
      ]
    },
    {
      "name": "walletUnfrozen",
      "discriminator": [
        55,
        62,
        221,
        216,
        232,
        67,
        159,
        210
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "exceedsPerTxLimit",
      "msg": "Transaction amount exceeds per-transaction limit"
    },
    {
      "code": 6001,
      "name": "exceedsDailyBudget",
      "msg": "Transaction would exceed daily budget"
    },
    {
      "code": 6002,
      "name": "programNotAllowed",
      "msg": "Target program is not on the allowlist"
    },
    {
      "code": 6003,
      "name": "outsideTimeWindow",
      "msg": "Transaction is outside the allowed time window"
    },
    {
      "code": 6004,
      "name": "walletFrozen",
      "msg": "Wallet is frozen"
    },
    {
      "code": 6005,
      "name": "unauthorized",
      "msg": "Unauthorized: only the wallet owner can perform this action"
    },
    {
      "code": 6006,
      "name": "unauthorizedAgent",
      "msg": "Unauthorized agent: caller is not the authorized agent"
    },
    {
      "code": 6007,
      "name": "insufficientBalance",
      "msg": "Insufficient wallet balance"
    },
    {
      "code": 6008,
      "name": "tooManyAllowedPrograms",
      "msg": "Too many allowed programs (max 10)"
    },
    {
      "code": 6009,
      "name": "tooManyAllowedRecipients",
      "msg": "Too many allowed recipients"
    },
    {
      "code": 6010,
      "name": "tooManyBlockedMints",
      "msg": "Too many blocked mints"
    },
    {
      "code": 6011,
      "name": "tooManyMintRules",
      "msg": "Too many mint rules"
    },
    {
      "code": 6012,
      "name": "tooManyCounterpartyMints",
      "msg": "Too many allowed mints for counterparty policy"
    },
    {
      "code": 6013,
      "name": "memoTooLong",
      "msg": "Memo too long (max 64 characters)"
    },
    {
      "code": 6014,
      "name": "blockedMint",
      "msg": "Asset mint is blocked by policy"
    },
    {
      "code": 6015,
      "name": "recipientNotAllowed",
      "msg": "Recipient is not allowed by policy"
    },
    {
      "code": 6016,
      "name": "approvalRequired",
      "msg": "Request requires owner approval"
    },
    {
      "code": 6017,
      "name": "requestExpired",
      "msg": "Request has expired"
    },
    {
      "code": 6018,
      "name": "requestNotPending",
      "msg": "Request is not pending"
    },
    {
      "code": 6019,
      "name": "requestNotApproved",
      "msg": "Request is not approved"
    },
    {
      "code": 6020,
      "name": "requestAlreadyExecuted",
      "msg": "Request has already been executed"
    },
    {
      "code": 6021,
      "name": "unsupportedExecutionTarget",
      "msg": "Execution target is not supported by this instruction"
    },
    {
      "code": 6022,
      "name": "unsupportedAssetExecution",
      "msg": "Asset execution path is not supported yet"
    },
    {
      "code": 6023,
      "name": "requestInstructionHashMismatch",
      "msg": "Instruction payload does not match the approved request"
    },
    {
      "code": 6024,
      "name": "requestAccountsHashMismatch",
      "msg": "Execution accounts do not match the approved request"
    },
    {
      "code": 6025,
      "name": "invalidCounterpartyPolicy",
      "msg": "Counterparty policy account does not match the request recipient"
    },
    {
      "code": 6026,
      "name": "invalidAssetTracker",
      "msg": "Asset tracker account does not match the request asset"
    },
    {
      "code": 6027,
      "name": "invalidExecutionAccounts",
      "msg": "Execution accounts do not satisfy preflight validation"
    },
    {
      "code": 6028,
      "name": "invalidExecutionPayload",
      "msg": "Execution payload does not satisfy preflight validation"
    },
    {
      "code": 6029,
      "name": "arithmeticOverflow",
      "msg": "Arithmetic overflow"
    },
    {
      "code": 6030,
      "name": "counterpartyPolicyRequired",
      "msg": "Counterparty policy enforcement is enabled but a matching counterparty account was not provided"
    },
    {
      "code": 6031,
      "name": "invalidTimeWindow",
      "msg": "Time window bounds must each be in [0, 86400)"
    },
    {
      "code": 6032,
      "name": "legacyExecuteDisabled",
      "msg": "Direct execute() is deprecated; use submit_request + execute_request"
    }
  ],
  "types": [
    {
      "name": "assetSpendTracker",
      "docs": [
        "Tracks cumulative spending for a specific asset within a budget period.",
        "PDA seeds: [b\"tracker\", wallet.key(), asset_mint.key()]"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "wallet",
            "docs": [
              "The wallet this tracker belongs to."
            ],
            "type": "pubkey"
          },
          {
            "name": "assetMint",
            "docs": [
              "Asset mint this tracker corresponds to. Native SOL uses Pubkey::default()."
            ],
            "type": "pubkey"
          },
          {
            "name": "spentInPeriod",
            "docs": [
              "Cumulative spend in the current period."
            ],
            "type": "u64"
          },
          {
            "name": "periodStart",
            "docs": [
              "Unix timestamp when the current period started."
            ],
            "type": "i64"
          },
          {
            "name": "periodDuration",
            "docs": [
              "Period duration in seconds."
            ],
            "type": "i64"
          },
          {
            "name": "bump",
            "docs": [
              "Bump seed."
            ],
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "auditEntry",
      "docs": [
        "On-chain audit log entry for each transaction decision.",
        "PDA seeds: [b\"audit\", wallet.key(), &total_tx_count.to_le_bytes()]"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "wallet",
            "docs": [
              "The wallet this entry belongs to."
            ],
            "type": "pubkey"
          },
          {
            "name": "requestId",
            "docs": [
              "Request this entry refers to. Legacy direct execution uses `u64::MAX`."
            ],
            "type": "u64"
          },
          {
            "name": "approved",
            "docs": [
              "Was the transaction approved?"
            ],
            "type": "bool"
          },
          {
            "name": "outcome",
            "docs": [
              "Outcome enum for richer lifecycle visibility."
            ],
            "type": "u8"
          },
          {
            "name": "amount",
            "docs": [
              "Amount requested."
            ],
            "type": "u64"
          },
          {
            "name": "assetMint",
            "docs": [
              "Asset mint for the request. Native SOL uses Pubkey::default()."
            ],
            "type": "pubkey"
          },
          {
            "name": "targetProgram",
            "docs": [
              "Target program the agent wanted to call."
            ],
            "type": "pubkey"
          },
          {
            "name": "recipient",
            "docs": [
              "Primary destination or recipient."
            ],
            "type": "pubkey"
          },
          {
            "name": "denialReason",
            "docs": [
              "Denial reason (0 = approved, 1 = exceeds per-tx, 2 = exceeds daily, 3 = program not allowed, 4 = outside time window, 5 = wallet frozen)."
            ],
            "type": "u8"
          },
          {
            "name": "memo",
            "docs": [
              "Human-readable memo from the agent."
            ],
            "type": "string"
          },
          {
            "name": "timestamp",
            "docs": [
              "Unix timestamp of the decision."
            ],
            "type": "i64"
          },
          {
            "name": "bump",
            "docs": [
              "Bump seed."
            ],
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "counterpartyPolicy",
      "docs": [
        "Recipient-specific policy override.",
        "PDA seeds: [b\"counterparty\", wallet.key(), recipient.key()]"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "wallet",
            "docs": [
              "Wallet this policy belongs to."
            ],
            "type": "pubkey"
          },
          {
            "name": "recipient",
            "docs": [
              "Recipient covered by this override."
            ],
            "type": "pubkey"
          },
          {
            "name": "enabled",
            "docs": [
              "Whether the override is enabled."
            ],
            "type": "bool"
          },
          {
            "name": "requireApproval",
            "docs": [
              "Whether requests to this recipient require approval."
            ],
            "type": "bool"
          },
          {
            "name": "maxPerTxOverride",
            "docs": [
              "Optional per-tx override."
            ],
            "type": {
              "option": "u64"
            }
          },
          {
            "name": "dailyLimitOverride",
            "docs": [
              "Optional daily limit override."
            ],
            "type": {
              "option": "u64"
            }
          },
          {
            "name": "allowedMints",
            "docs": [
              "Allowed mints for this recipient."
            ],
            "type": {
              "vec": "pubkey"
            }
          },
          {
            "name": "bump",
            "docs": [
              "Bump seed."
            ],
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "counterpartyPolicyUpserted",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "wallet",
            "type": "pubkey"
          },
          {
            "name": "recipient",
            "type": "pubkey"
          },
          {
            "name": "enabled",
            "type": "bool"
          },
          {
            "name": "requireApproval",
            "type": "bool"
          },
          {
            "name": "timestamp",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "executionRequest",
      "docs": [
        "Canonical request account for the agent's intended action.",
        "PDA seeds: [b\"request\", wallet.key(), request_id.to_le_bytes()]"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "wallet",
            "docs": [
              "Wallet this request belongs to."
            ],
            "type": "pubkey"
          },
          {
            "name": "requestId",
            "docs": [
              "Monotonic request id."
            ],
            "type": "u64"
          },
          {
            "name": "agent",
            "docs": [
              "Agent that submitted the request."
            ],
            "type": "pubkey"
          },
          {
            "name": "targetProgram",
            "docs": [
              "Target program to execute against."
            ],
            "type": "pubkey"
          },
          {
            "name": "recipient",
            "docs": [
              "Recipient or primary destination."
            ],
            "type": "pubkey"
          },
          {
            "name": "assetMint",
            "docs": [
              "Asset mint for the request. Native SOL uses Pubkey::default()."
            ],
            "type": "pubkey"
          },
          {
            "name": "amount",
            "docs": [
              "Requested amount."
            ],
            "type": "u64"
          },
          {
            "name": "status",
            "docs": [
              "Request lifecycle state."
            ],
            "type": "u8"
          },
          {
            "name": "instructionHash",
            "docs": [
              "Hash of the encoded instruction data."
            ],
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "accountsHash",
            "docs": [
              "Hash of the relevant account meta list."
            ],
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "memo",
            "docs": [
              "Request memo."
            ],
            "type": "string"
          },
          {
            "name": "requestedAt",
            "docs": [
              "Creation timestamp."
            ],
            "type": "i64"
          },
          {
            "name": "expiresAt",
            "docs": [
              "Optional expiration timestamp."
            ],
            "type": {
              "option": "i64"
            }
          },
          {
            "name": "reviewedBy",
            "docs": [
              "Reviewer, once approved or rejected."
            ],
            "type": {
              "option": "pubkey"
            }
          },
          {
            "name": "reviewedAt",
            "docs": [
              "Review timestamp."
            ],
            "type": {
              "option": "i64"
            }
          },
          {
            "name": "bump",
            "docs": [
              "Bump seed."
            ],
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "mintRule",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "mint",
            "docs": [
              "Asset mint this rule applies to. Native SOL uses Pubkey::default()."
            ],
            "type": "pubkey"
          },
          {
            "name": "maxPerTx",
            "docs": [
              "Max amount per transaction for this asset."
            ],
            "type": "u64"
          },
          {
            "name": "maxDaily",
            "docs": [
              "Max amount per period for this asset."
            ],
            "type": "u64"
          },
          {
            "name": "requireApprovalAbove",
            "docs": [
              "Optional threshold above which approval is required."
            ],
            "type": {
              "option": "u64"
            }
          }
        ]
      }
    },
    {
      "name": "policy",
      "docs": [
        "Spending policy tied to a wallet.",
        "PDA seeds: [b\"policy\", wallet.key()]"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "version",
            "docs": [
              "Account schema version."
            ],
            "type": "u8"
          },
          {
            "name": "wallet",
            "docs": [
              "The wallet this policy governs."
            ],
            "type": "pubkey"
          },
          {
            "name": "maxPerTx",
            "docs": [
              "Max lamports/tokens per single transaction."
            ],
            "type": "u64"
          },
          {
            "name": "maxDaily",
            "docs": [
              "Max lamports/tokens per rolling daily period."
            ],
            "type": "u64"
          },
          {
            "name": "approvalThreshold",
            "docs": [
              "Optional threshold above which requests require owner approval."
            ],
            "type": {
              "option": "u64"
            }
          },
          {
            "name": "requireApprovalForNewRecipients",
            "docs": [
              "Whether new recipients require approval instead of hard denial."
            ],
            "type": "bool"
          },
          {
            "name": "allowedPrograms",
            "docs": [
              "Allowed target program IDs (max 10). Empty = allow all."
            ],
            "type": {
              "vec": "pubkey"
            }
          },
          {
            "name": "allowedRecipients",
            "docs": [
              "Allowed recipients. Empty = allow all recipients."
            ],
            "type": {
              "vec": "pubkey"
            }
          },
          {
            "name": "blockedMints",
            "docs": [
              "Asset mints that can never be used."
            ],
            "type": {
              "vec": "pubkey"
            }
          },
          {
            "name": "mintRules",
            "docs": [
              "Asset-specific rule overrides."
            ],
            "type": {
              "vec": {
                "defined": {
                  "name": "mintRule"
                }
              }
            }
          },
          {
            "name": "timeWindowStart",
            "docs": [
              "Optional: earliest unix timestamp in day the agent can transact (seconds from midnight UTC)."
            ],
            "type": {
              "option": "i64"
            }
          },
          {
            "name": "timeWindowEnd",
            "docs": [
              "Optional: latest unix timestamp in day the agent can transact (seconds from midnight UTC)."
            ],
            "type": {
              "option": "i64"
            }
          },
          {
            "name": "enforceCounterpartyPolicy",
            "docs": [
              "When true, every submit_request must include a CounterpartyPolicy account",
              "whose PDA matches (wallet, recipient). Closes the C2 bypass where the",
              "agent omits the optional counterparty account to skip its checks."
            ],
            "type": "bool"
          },
          {
            "name": "bump",
            "docs": [
              "Bump seed for the PDA."
            ],
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "policyUpdated",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "wallet",
            "type": "pubkey"
          },
          {
            "name": "owner",
            "type": "pubkey"
          },
          {
            "name": "maxPerTx",
            "type": "u64"
          },
          {
            "name": "maxDaily",
            "type": "u64"
          },
          {
            "name": "timestamp",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "requestApproved",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "wallet",
            "type": "pubkey"
          },
          {
            "name": "requestId",
            "type": "u64"
          },
          {
            "name": "reviewer",
            "type": "pubkey"
          },
          {
            "name": "timestamp",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "requestDenied",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "wallet",
            "type": "pubkey"
          },
          {
            "name": "requestId",
            "type": "u64"
          },
          {
            "name": "reason",
            "type": "u8"
          },
          {
            "name": "amount",
            "type": "u64"
          },
          {
            "name": "timestamp",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "requestExecuted",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "wallet",
            "type": "pubkey"
          },
          {
            "name": "requestId",
            "type": "u64"
          },
          {
            "name": "recipient",
            "type": "pubkey"
          },
          {
            "name": "assetMint",
            "type": "pubkey"
          },
          {
            "name": "amount",
            "type": "u64"
          },
          {
            "name": "timestamp",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "requestRejected",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "wallet",
            "type": "pubkey"
          },
          {
            "name": "requestId",
            "type": "u64"
          },
          {
            "name": "reviewer",
            "type": "pubkey"
          },
          {
            "name": "reason",
            "type": "u8"
          },
          {
            "name": "timestamp",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "requestSubmitted",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "wallet",
            "type": "pubkey"
          },
          {
            "name": "requestId",
            "type": "u64"
          },
          {
            "name": "agent",
            "type": "pubkey"
          },
          {
            "name": "recipient",
            "type": "pubkey"
          },
          {
            "name": "assetMint",
            "type": "pubkey"
          },
          {
            "name": "amount",
            "type": "u64"
          },
          {
            "name": "status",
            "type": "u8"
          },
          {
            "name": "timestamp",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "smartWallet",
      "docs": [
        "Smart wallet account — agent funds live here.",
        "PDA seeds: [b\"wallet\", owner.key(), agent.key()]"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "version",
            "docs": [
              "Account schema version."
            ],
            "type": "u8"
          },
          {
            "name": "owner",
            "docs": [
              "The human owner who controls the wallet and policy."
            ],
            "type": "pubkey"
          },
          {
            "name": "agent",
            "docs": [
              "The AI agent authorized to request transactions."
            ],
            "type": "pubkey"
          },
          {
            "name": "frozen",
            "docs": [
              "Whether the wallet is frozen (kill switch)."
            ],
            "type": "bool"
          },
          {
            "name": "bump",
            "docs": [
              "Bump seed for the PDA."
            ],
            "type": "u8"
          },
          {
            "name": "nextRequestId",
            "docs": [
              "Monotonic request nonce."
            ],
            "type": "u64"
          },
          {
            "name": "nextAuditId",
            "docs": [
              "Monotonic audit nonce."
            ],
            "type": "u64"
          },
          {
            "name": "totalApproved",
            "docs": [
              "Total approved transactions."
            ],
            "type": "u64"
          },
          {
            "name": "totalDenied",
            "docs": [
              "Total denied transactions."
            ],
            "type": "u64"
          },
          {
            "name": "totalPending",
            "docs": [
              "Total requests awaiting owner action."
            ],
            "type": "u64"
          },
          {
            "name": "createdAt",
            "docs": [
              "Timestamp of wallet creation."
            ],
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "spendTracker",
      "docs": [
        "Tracks cumulative spending for a wallet within a budget period.",
        "PDA seeds: [b\"tracker\", wallet.key()]"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "wallet",
            "docs": [
              "The wallet this tracker belongs to."
            ],
            "type": "pubkey"
          },
          {
            "name": "spentInPeriod",
            "docs": [
              "Cumulative spend in the current period."
            ],
            "type": "u64"
          },
          {
            "name": "periodStart",
            "docs": [
              "Unix timestamp when the current period started."
            ],
            "type": "i64"
          },
          {
            "name": "periodDuration",
            "docs": [
              "Period duration in seconds (default: 86400 = 24 hours)."
            ],
            "type": "i64"
          },
          {
            "name": "bump",
            "docs": [
              "Bump seed."
            ],
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "walletCreated",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "wallet",
            "type": "pubkey"
          },
          {
            "name": "owner",
            "type": "pubkey"
          },
          {
            "name": "agent",
            "type": "pubkey"
          },
          {
            "name": "maxPerTx",
            "type": "u64"
          },
          {
            "name": "maxDaily",
            "type": "u64"
          },
          {
            "name": "timestamp",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "walletFrozen",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "wallet",
            "type": "pubkey"
          },
          {
            "name": "owner",
            "type": "pubkey"
          },
          {
            "name": "timestamp",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "walletUnfrozen",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "wallet",
            "type": "pubkey"
          },
          {
            "name": "owner",
            "type": "pubkey"
          },
          {
            "name": "timestamp",
            "type": "i64"
          }
        ]
      }
    }
  ],
  "constants": [
    {
      "name": "walletSeed",
      "docs": [
        "Seed prefixes for PDAs."
      ],
      "type": "bytes",
      "value": "[119, 97, 108, 108, 101, 116]"
    }
  ]
};
