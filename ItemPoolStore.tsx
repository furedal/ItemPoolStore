import { observable } from 'mobx'
import { isArray, merge } from '~libs/utils'

export interface IApiItem {
  __name: string
  id: string
}

import { observable } from 'mobx'
import { IApiItem } from '~libs/models'
import { isArray, merge } from '~libs/utils'

export class ItemPoolStore {
  @observable
  itemPool: { [key: string]: IApiItem[] } = {}

  findBy = <T extends IApiItem>(key: string, value: string, poolKey: string) => {
    return this.getPool(poolKey).find((item) => item[key] === value) as T
  }

  /**
   * Recursively get all items from the pool.
   * Each item that doesn't already exist in the pool will be added.
   * If the item already exist, it will instead be updated.
   * The items in the pool will be returned
   *
   * All items returned will be an observable mobx object
   */
  storeArrayToPool = <T extends IApiItem>(items: T[]) => {
    return items.map((item) => this.storeToPool(item)) as T[]
  }

  /**
   * Recursively get item from the pool.
   * If the item didn't exist, it will be added to the pool.
   * If the the item already existed, it will be updated with the new data.
   *
   * The item returned will be an observable mobx object
   */
  storeToPool = <T extends IApiItem>(item: T | T[]) => {
    if (isArray(item)) {
      return this.storeArrayToPool(item)
    }

    if (!item.id || !item.__name) {
      return item
    }

    Object.keys(item).forEach((key) => {
      if (isArray(item[key])) {
        item[key] = this.storeArrayToPool(item[key])
      } else if (typeof item[key] === 'object') {
        item[key] = this.storeToPool(item[key])
      }
    })

    const pool = this.getPool(item.__name)
    let index = pool.findIndex((i) => i.id === item.id)
    if (index === -1) {
      index = pool.push(item) - 1
    } else {
      merge(item, pool[index])
    }

    return pool[index] as T
  }

  /**
   * Get pool by key. A pool will be created for the given key if it doesn't already exist.
   */
  getPool = (key: string) => {
    if (!this.itemPool[key]) {
      this.itemPool[key] = observable([])
    }
    return this.itemPool[key]
  }
}
