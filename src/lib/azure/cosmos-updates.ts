// Helper functions for updating items in Cosmos DB
import { getContainer } from './cosmos';

/**
 * Update a specific item in a container
 */
export async function updateItem<T extends { id: string }>(
    containerId: string,
    id: string,
    partitionKey: string,
    updates: Partial<T>
): Promise<T> {
    const container = getContainer(containerId);

    // Read the current item
    const { resource: currentItem } = await container.item(id, partitionKey).read<T>();

    if (!currentItem) {
        throw new Error(`Item ${id} not found in container ${containerId}`);
    }

    // Merge updates with current item
    const updatedItem = {
        ...currentItem,
        ...updates,
        updatedAt: new Date().toISOString()
    };

    // Replace the item
    const { resource } = await container.item(id, partitionKey).replace(updatedItem);
    return resource as T;
}

/**
 * Query and update the first matching item
 */
export async function queryAndUpdateFirst<T extends { id: string; userId?: string }>(
    containerId: string,
    query: string,
    parameters: any[],
    updates: Partial<T>
): Promise<T> {
    const container = getContainer(containerId);

    // Query for the item
    const { resources } = await container.items
        .query({ query, parameters })
        .fetchAll();

    if (resources.length === 0) {
        throw new Error(`No items found matching query in ${containerId}`);
    }

    const item = resources[0] as T;

    // Determine partition key (try userId first, then id)
    const partitionKey = item.userId || item.id;

    // Update the item
    return updateItem(containerId, item.id, partitionKey, updates);
}

/**
 * Increment a numeric field (simulating FieldValue.increment)
 */
export async function incrementField(
    containerId: string,
    id: string,
    partitionKey: string,
    field: string,
    amount: number
): Promise<void> {
    const container = getContainer(containerId);

    const { resource: currentItem } = await container.item(id, partitionKey).read();

    if (!currentItem) {
        throw new Error(`Item ${id} not found`);
    }

    const updatedItem = {
        ...currentItem,
        [field]: (currentItem[field] || 0) + amount,
        updatedAt: new Date().toISOString()
    };

    await container.item(id, partitionKey).replace(updatedItem);
}
