/**
 * Catalyst Data Store Adapter
 * 
 * When Catalyst is configured: uses Catalyst Data Store (ZC_core_datastore)
 * When running locally: the existing Prisma/SQLite client is used directly
 * 
 * This module provides an abstraction layer so business logic
 * doesn't need to know whether it's running on Catalyst or locally.
 */

import { catalystConfig } from './config'
import { getCatalystSDK } from './sdk'

export interface QueryCondition {
  column: string
  operator: 'EQ' | 'NEQ' | 'GT' | 'GTE' | 'LT' | 'LTE' | 'LIKE' | 'IN'
  value: unknown
}

export interface CatalystTable {
  name: string
  insert: (row: Record<string, unknown>) => Promise<Record<string, unknown>>
  getRow: (rowId: string) => Promise<Record<string, unknown> | null>
  updateRow: (rowId: string, data: Record<string, unknown>) => Promise<Record<string, unknown>>
  deleteRow: (rowId: string) => Promise<void>
  query: (conditions?: QueryCondition[]) => Promise<Record<string, unknown>[]>
  getAllRows: () => Promise<Record<string, unknown>[]>
}

/** 
 * Get a Catalyst Data Store table wrapper.
 * Returns null when running locally (use Prisma directly instead).
 */
export async function getTable(tableName: string): Promise<CatalystTable | null> {
  if (!catalystConfig.isCatalyst) {
    console.log(`[DataStore] Local mode — use Prisma db.${tableName} directly`)
    return null
  }

  try {
    const { ZCatalystApp } = await getCatalystSDK()
    const app = ZCatalystApp.getInstance()
    const datastore = app.datastore()
    const table = datastore.table(tableName)

    return {
      name: tableName,

      insert: async (row) => {
        const result = await table.insertRow(row)
        return result as Record<string, unknown>
      },

      getRow: async (rowId) => {
        const result = await table.getRow(rowId)
        return result as Record<string, unknown> | null
      },

      updateRow: async (rowId, data) => {
        const result = await table.updateRow(rowId, data)
        return result as Record<string, unknown>
      },

      deleteRow: async (rowId) => {
        await table.deleteRow(rowId)
      },

      query: async (conditions = []) => {
        const query = table.query()
        for (const c of conditions) {
          query.addCondition(c.column, c.operator, c.value)
        }
        const result = await query.get()
        return result as Record<string, unknown>[]
      },

      getAllRows: async () => {
        const result = await table.getAllRows()
        return result as Record<string, unknown>[]
      },
    }
  } catch (error) {
    console.error(`[DataStore] Failed to get table '${tableName}':`, error)
    return null
  }
}

/** 
 * Full-text search using Catalyst Data Store search.
 * When local, returns empty array (use Prisma contains queries).
 */
export async function fullTextSearch(
  tableName: string,
  searchColumns: string[],
  searchTerm: string,
): Promise<Record<string, unknown>[]> {
  if (!catalystConfig.isCatalyst) return []

  try {
    const { ZCatalystApp } = await getCatalystSDK()
    const app = ZCatalystApp.getInstance()
    const datastore = app.datastore()
    const table = datastore.table(tableName)

    const query = table.searchQuery(searchTerm)
    for (const col of searchColumns) {
      query.searchColumn(col)
    }
    const result = await query.get()
    return result as Record<string, unknown>[]
  } catch (error) {
    console.error(`[DataStore] Search failed on '${tableName}':`, error)
    return []
  }
}
