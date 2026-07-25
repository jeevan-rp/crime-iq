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
import { getCatalystApp } from './sdk'

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
    const app = await getCatalystApp()
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
        // zcatalyst-sdk-node updateRow takes the row object directly containing ROWID
        const result = await table.updateRow({ ROWID: rowId, ...data })
        return result as Record<string, unknown>
      },

      deleteRow: async (rowId) => {
        // zcatalyst-sdk-node deletes by referencing row object and calling delete
        const row = table.row(rowId)
        await row.delete()
      },

      query: async (conditions = []) => {
        // Building custom ZCQL query from conditions for zcatalyst-sdk-node compatibility
        let zcql = `SELECT * FROM ${tableName}`
        if (conditions.length > 0) {
          const condStrings = conditions.map(c => {
            const valStr = typeof c.value === 'string' ? `'${c.value}'` : c.value
            return `${c.column} ${c.operator} ${valStr}`
          })
          zcql += ` WHERE ${condStrings.join(' AND ')}`
        }
        const result = await app.zcql().executeZCQLQuery(zcql)
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
    const app = await getCatalystApp()
    
    // zcatalyst-sdk-node search implementation
    const searchConfig = {
      search: searchTerm,
      search_table_columns: {
        [tableName]: searchColumns
      }
    }
    
    const search = app.search()
    const result = await search.executeSearchQuery(searchConfig)
    return result as Record<string, unknown>[]
  } catch (error) {
    console.error(`[DataStore] Search failed on '${tableName}':`, error)
    return []
  }
}
