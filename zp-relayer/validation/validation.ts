import Ajv, { JSONSchemaType, ValidateFunction } from 'ajv'
import { Proof, SnarkProof } from 'libzkbob-rs-node'
import type { PoolTx } from '../pool'
import { TxType } from 'zp-memo-parser'

const ajv = new Ajv({ allErrors: true, coerceTypes: true, useDefaults: true })

const AjvString: JSONSchemaType<string> = { type: 'string' }
const AjvG1Point: JSONSchemaType<[string, string]> = {
  type: 'array',
  minItems: 2,
  maxItems: 2,
  items: [AjvString, AjvString],
}

const AjvG2Point: JSONSchemaType<[[string, string], [string, string]]> = {
  type: 'array',
  minItems: 2,
  maxItems: 2,
  items: [AjvG1Point, AjvG1Point],
}

const AjvSnarkProofSchema: JSONSchemaType<SnarkProof> = {
  type: 'object',
  properties: {
    a: AjvG1Point,
    b: AjvG2Point,
    c: AjvG1Point,
  },
  required: ['a', 'b', 'c'],
}

const AjvProofSchema: JSONSchemaType<Proof> = {
  type: 'object',
  properties: {
    inputs: {
      type: 'array',
      items: { type: 'string' },
    },
    proof: AjvSnarkProofSchema,
  },
  required: ['inputs', 'proof'],
}

const AjvSendTransactionSchema: JSONSchemaType<PoolTx> = {
  type: 'object',
  properties: {
    proof: AjvProofSchema,
    memo: AjvString,
    txType: {
      type: 'string',
      enum: [TxType.DEPOSIT, TxType.PERMITTABLE_DEPOSIT, TxType.TRANSFER, TxType.WITHDRAWAL],
    },
    depositSignature: { type: 'string', nullable: true },
  },
  required: ['proof', 'memo', 'txType'],
}

const AjvSendTransactionsSchema: JSONSchemaType<PoolTx[]> = {
  type: 'array',
  items: AjvSendTransactionSchema,
}

const AjvGetTransactionsSchema: JSONSchemaType<{
  limit: number
  offset: number
  optimistic: boolean
}> = {
  type: 'object',
  properties: {
    limit: {
      type: 'integer',
      minimum: 1,
      default: 100,
    },
    offset: {
      type: 'integer',
      minimum: 0,
      default: 0,
    },
    optimistic: {
      type: 'boolean',
      default: false,
    },
  },
  required: [],
}

const AjvGetTransactionsV2Schema: JSONSchemaType<{
  limit: number
  offset: number
}> = {
  type: 'object',
  properties: {
    limit: {
      type: 'integer',
      minimum: 1,
      default: 100,
    },
    offset: {
      type: 'integer',
      minimum: 0,
      default: 0,
    },
  },
  required: [],
}

const validateSendTransaction = ajv.compile(AjvSendTransactionSchema)
const validateSendTransactions = ajv.compile(AjvSendTransactionsSchema)
const validateGetTransactions = ajv.compile(AjvGetTransactionsSchema)
const validateGetTransactionsV2 = ajv.compile(AjvGetTransactionsV2Schema)

function checkErrors(validate: ValidateFunction) {
  return (data: any) => {
    validate(data)
    if (validate.errors) {
      return validate.errors.map(e => {
        return { path: e.instancePath, message: e.message }
      })
    }
    return null
  }
}

export const checkSendTransactionErrors = checkErrors(validateSendTransaction)
export const checkSendTransactionsErrors = checkErrors(validateSendTransactions)
export const checkGetTransactions = checkErrors(validateGetTransactions)
export const checkGetTransactionsV2 = checkErrors(validateGetTransactionsV2)
