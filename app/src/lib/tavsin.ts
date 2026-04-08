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
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  119,
                  97,
                  108,
                  108,
                  101,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "owner"
              },
              {
                "kind": "account",
                "path": "agent"
              }
            ]
          }
        },
        {
          "name": "policy",
          "docs": [
            "The policy PDA tied to this wallet."
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  111,
                  108,
                  105,
                  99,
                  121
                ]
              },
              {
                "kind": "account",
                "path": "wallet"
              }
            ]
          }
        },
        {
          "name": "tracker",
          "docs": [
            "The spend tracker PDA tied to this wallet."
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  116,
                  114,
                  97,
                  99,
                  107,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "wallet"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
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
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  119,
                  97,
                  108,
                  108,
                  101,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "wallet.owner",
                "account": "smartWallet"
              },
              {
                "kind": "account",
                "path": "wallet.agent",
                "account": "smartWallet"
              }
            ]
          }
        },
        {
          "name": "policy",
          "docs": [
            "The policy governing this wallet."
          ],
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  111,
                  108,
                  105,
                  99,
                  121
                ]
              },
              {
                "kind": "account",
                "path": "wallet"
              }
            ]
          }
        },
        {
          "name": "tracker",
          "docs": [
            "The spend tracker for budget enforcement."
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  116,
                  114,
                  97,
                  99,
                  107,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "wallet"
              }
            ]
          }
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
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
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
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  119,
                  97,
                  108,
                  108,
                  101,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "wallet.owner",
                "account": "smartWallet"
              },
              {
                "kind": "account",
                "path": "wallet.agent",
                "account": "smartWallet"
              }
            ]
          }
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
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  119,
                  97,
                  108,
                  108,
                  101,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "wallet.owner",
                "account": "smartWallet"
              },
              {
                "kind": "account",
                "path": "wallet.agent",
                "account": "smartWallet"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
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
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  119,
                  97,
                  108,
                  108,
                  101,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "wallet.owner",
                "account": "smartWallet"
              },
              {
                "kind": "account",
                "path": "wallet.agent",
                "account": "smartWallet"
              }
            ]
          }
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
          "name": "wallet",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  119,
                  97,
                  108,
                  108,
                  101,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "wallet.owner",
                "account": "smartWallet"
              },
              {
                "kind": "account",
                "path": "wallet.agent",
                "account": "smartWallet"
              }
            ]
          }
        },
        {
          "name": "policy",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  111,
                  108,
                  105,
                  99,
                  121
                ]
              },
              {
                "kind": "account",
                "path": "wallet"
              }
            ]
          }
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
          "name": "allowedPrograms",
          "type": {
            "option": {
              "vec": "pubkey"
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
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  119,
                  97,
                  108,
                  108,
                  101,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "wallet.owner",
                "account": "smartWallet"
              },
              {
                "kind": "account",
                "path": "wallet.agent",
                "account": "smartWallet"
              }
            ]
          }
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
      "name": "memoTooLong",
      "msg": "Memo too long (max 64 characters)"
    }
  ],
  "types": [
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
            "name": "approved",
            "docs": [
              "Was the transaction approved?"
            ],
            "type": "bool"
          },
          {
            "name": "amount",
            "docs": [
              "Amount requested."
            ],
            "type": "u64"
          },
          {
            "name": "targetProgram",
            "docs": [
              "Target program the agent wanted to call."
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
      "name": "policy",
      "docs": [
        "Spending policy tied to a wallet.",
        "PDA seeds: [b\"policy\", wallet.key()]"
      ],
      "type": {
        "kind": "struct",
        "fields": [
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
            "name": "allowedPrograms",
            "docs": [
              "Allowed target program IDs (max 10). Empty = allow all."
            ],
            "type": {
              "vec": "pubkey"
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
      "name": "smartWallet",
      "docs": [
        "Smart wallet account — agent funds live here.",
        "PDA seeds: [b\"wallet\", owner.key(), agent.key()]"
      ],
      "type": {
        "kind": "struct",
        "fields": [
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
