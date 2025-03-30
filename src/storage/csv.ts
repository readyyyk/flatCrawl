/**
 * CSV storage implementation for the FlatCrawl application
 */
import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import { stringify } from 'csv-stringify/sync';
import { UrlRecord } from '../types/index.js';
import { Logger } from '../utils/logger.js';

const logger = new Logger('CsvStorage');

/**
 * CSV storage class
 */
export class CsvStorage {
  /**
   * Create a new CSV storage
   * @param csvPath Path to the CSV file
   */
  constructor(private csvPath: string) {
    this.ensureFileExists();
  }

  /**
   * Ensure the CSV file exists with headers
   */
  private ensureFileExists(): void {
    if (!fs.existsSync(this.csvPath)) {
      logger.info(`Creating new CSV file at ${this.csvPath}`);
      const headers = 'id,source,cost,url,dateAdded,seen,ok,called,active,archived\n';
      fs.writeFileSync(this.csvPath, headers);
    }
  }

  /**
   * Read all records from the CSV file
   * @returns Array of URL records
   */
  read(): UrlRecord[] {
    try {
      logger.debug(`Reading CSV file from ${this.csvPath}`);
      const csvContent = fs.readFileSync(this.csvPath, 'utf8');
      
      const records = parse(csvContent, {
        columns: true,
        skip_empty_lines: true
      });
      
      // Convert string boolean values to actual booleans and provide defaults for new fields
      const formattedRecords = records.map((record: any) => ({
        ...record,
        // Ensure cost field exists (default to empty string)
        cost: record.cost || '',
        seen: record.seen === 'true',
        ok: record.ok === 'true',
        called: record.called === 'true',
        active: record.active === 'true',
        // Ensure archived field exists (default to false)
        archived: record.archived === 'true'
      }));
      
      logger.debug(`Read ${formattedRecords.length} records from CSV`);
      return formattedRecords;
    } catch (error) {
      logger.error('Error reading CSV file:', error);
      throw new Error(`Failed to read CSV file: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Write records to the CSV file
   * @param records Array of URL records to write
   */
  write(records: UrlRecord[]): void {
    try {
      logger.debug(`Writing ${records.length} records to CSV file`);
      
      // Convert boolean values back to strings
      const formattedRecords = records.map(record => ({
        ...record,
        seen: String(record.seen),
        ok: String(record.ok),
        called: String(record.called),
        active: String(record.active),
        archived: String(record.archived)
      }));
      
      // Convert to CSV
      const csvOutput = stringify(formattedRecords, {
        header: true,
        columns: ['id', 'source', 'cost', 'url', 'dateAdded', 'seen', 'ok', 'called', 'active', 'archived']
      });
      
      // Write to file
      fs.writeFileSync(this.csvPath, csvOutput);
      logger.debug('CSV file written successfully');
    } catch (error) {
      logger.error('Error writing CSV file:', error);
      throw new Error(`Failed to write CSV file: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get the highest ID from the CSV file
   * @returns The highest ID
   */
  getHighestId(): number {
    try {
      const records = this.read();
      
      if (records.length === 0) {
        return 0;
      }
      
      const ids = records.map(record => parseInt(record.id, 10));
      return Math.max(...ids);
    } catch (error) {
      logger.error('Error getting highest ID:', error);
      return 0;
    }
  }

  /**
   * Get a set of all existing URLs in the CSV file
   * @returns Set of URLs
   */
  getExistingUrls(): Set<string> {
    try {
      const records = this.read();
      return new Set(records.map(record => record.url));
    } catch (error) {
      logger.error('Error getting existing URLs:', error);
      return new Set();
    }
  }

  /**
   * Append new records to the CSV file
   * @param newRecords Records to append (without IDs)
   * @returns The added records with IDs
   */
  appendRecords(newRecords: Omit<UrlRecord, 'id'>[]): UrlRecord[] {
    try {
      logger.info(`Appending ${newRecords.length} new records to CSV`);
      
      // Read existing records
      const records = this.read();
      
      // Get highest ID
      const highestId = this.getHighestId();
      
      // Create new records with IDs
      const recordsToAdd = newRecords.map((record, index) => ({
        ...record,
        id: String(highestId + index + 1)
      }));
      
      // Combine records
      const updatedRecords = [...records, ...recordsToAdd];
      
      // Write back to CSV
      this.write(updatedRecords);
      
      logger.info(`Successfully added ${recordsToAdd.length} records to CSV`);
      return recordsToAdd;
    } catch (error) {
      logger.error('Error appending records:', error);
      throw new Error(`Failed to append records: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Update existing records in the CSV file
   * @param updatedRecords Records to update
   */
  updateRecords(updatedRecords: UrlRecord[]): void {
    try {
      logger.info(`Updating ${updatedRecords.length} records in CSV`);
      
      // Read existing records
      const records = this.read();
      
      // Create a map of existing records by ID
      const recordMap = new Map(records.map(record => [record.id, record]));
      
      // Update records
      for (const record of updatedRecords) {
        recordMap.set(record.id, record);
      }
      
      // Convert map back to array
      const newRecords = Array.from(recordMap.values());
      
      // Write back to CSV
      this.write(newRecords);
      
      logger.info('Records updated successfully');
    } catch (error) {
      logger.error('Error updating records:', error);
      throw new Error(`Failed to update records: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}