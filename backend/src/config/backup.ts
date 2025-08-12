import { logInfo, logError } from './logger';

export interface BackupConfig {
  enabled: boolean;
  schedule: string; // Cron expression
  retention: {
    daily: number;
    weekly: number;
    monthly: number;
  };
  storage: {
    type: 'local' | 's3';
    path?: string;
    bucket?: string;
    region?: string;
  };
  compression: boolean;
  encryption: boolean;
}

export const defaultBackupConfig: BackupConfig = {
  enabled: process.env['BACKUP_ENABLED'] === 'true',
  schedule: process.env['BACKUP_SCHEDULE'] || '0 2 * * *', // Daily at 2 AM
  retention: {
    daily: parseInt(process.env['BACKUP_RETENTION_DAILY'] || '7'),
    weekly: parseInt(process.env['BACKUP_RETENTION_WEEKLY'] || '4'),
    monthly: parseInt(process.env['BACKUP_RETENTION_MONTHLY'] || '12')
  },
  storage: {
    type: (process.env['BACKUP_STORAGE_TYPE'] as 'local' | 's3') || 'local',
    path: process.env['BACKUP_LOCAL_PATH'] || './backups',
    ...(process.env['BACKUP_S3_BUCKET'] && { bucket: process.env['BACKUP_S3_BUCKET'] }),
    ...(process.env['BACKUP_S3_REGION'] && { region: process.env['BACKUP_S3_REGION'] })
  },
  compression: process.env['BACKUP_COMPRESSION'] !== 'false',
  encryption: process.env['BACKUP_ENCRYPTION'] === 'true'
};

export class DatabaseBackup {
  private config: BackupConfig;

  constructor(config: BackupConfig = defaultBackupConfig) {
    this.config = config;
  }

  /**
   * Create a database backup
   */
  async createBackup(): Promise<string> {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `backup-${timestamp}.sql`;
      const filepath = `${this.config.storage.path}/${filename}`;

      // Create backup directory if it doesn't exist
      if (this.config.storage.type === 'local') {
        await this.ensureBackupDirectory();
      }

      // Create backup using pg_dump
      const backupCommand = this.buildBackupCommand(filepath);
      
      logInfo('Starting database backup', {
        filename,
        filepath,
        compression: this.config.compression,
        encryption: this.config.encryption
      });

      // Execute backup command
      const { exec } = require('child_process');
      const { promisify } = require('util');
      const execAsync = promisify(exec);

      await execAsync(backupCommand);

      // Compress if enabled
      if (this.config.compression) {
        await this.compressBackup(filepath);
      }

      // Encrypt if enabled
      if (this.config.encryption) {
        await this.encryptBackup(filepath);
      }

      // Upload to cloud storage if configured
      if (this.config.storage.type === 's3') {
        await this.uploadToS3(filepath, filename);
      }

      logInfo('Database backup completed successfully', {
        filename,
        filepath,
        size: await this.getFileSize(filepath)
      });

      return filepath;
    } catch (error) {
      logError('Database backup failed', error);
      throw error;
    }
  }

  /**
   * Restore database from backup
   */
  async restoreBackup(backupPath: string): Promise<void> {
    try {
      logInfo('Starting database restore', { backupPath });

      // Decrypt if needed
      if (this.config.encryption) {
        await this.decryptBackup(backupPath);
      }

      // Decompress if needed
      if (this.config.compression) {
        await this.decompressBackup(backupPath);
      }

      // Build restore command
      const restoreCommand = this.buildRestoreCommand(backupPath);

      // Execute restore command
      const { exec } = require('child_process');
      const { promisify } = require('util');
      const execAsync = promisify(exec);

      await execAsync(restoreCommand);

      logInfo('Database restore completed successfully');
    } catch (error) {
      logError('Database restore failed', error);
      throw error;
    }
  }

  /**
   * Clean up old backups based on retention policy
   */
  async cleanupOldBackups(): Promise<void> {
    try {
      logInfo('Starting backup cleanup');

      const backups = await this.listBackups();

      // Remove old daily backups
      const dailyBackups = backups.filter(b => b.type === 'daily');
      if (dailyBackups.length > this.config.retention.daily) {
        const toDelete = dailyBackups
          .sort((a, b) => b.date.getTime() - a.date.getTime())
          .slice(this.config.retention.daily);
        
        for (const backup of toDelete) {
          await this.deleteBackup(backup.path);
        }
      }

      // Remove old weekly backups
      const weeklyBackups = backups.filter(b => b.type === 'weekly');
      if (weeklyBackups.length > this.config.retention.weekly) {
        const toDelete = weeklyBackups
          .sort((a, b) => b.date.getTime() - a.date.getTime())
          .slice(this.config.retention.weekly);
        
        for (const backup of toDelete) {
          await this.deleteBackup(backup.path);
        }
      }

      // Remove old monthly backups
      const monthlyBackups = backups.filter(b => b.type === 'monthly');
      if (monthlyBackups.length > this.config.retention.monthly) {
        const toDelete = monthlyBackups
          .sort((a, b) => b.date.getTime() - a.date.getTime())
          .slice(this.config.retention.monthly);
        
        for (const backup of toDelete) {
          await this.deleteBackup(backup.path);
        }
      }

      logInfo('Backup cleanup completed');
    } catch (error) {
      logError('Backup cleanup failed', error);
      throw error;
    }
  }

  private async ensureBackupDirectory(): Promise<void> {
    const fs = require('fs').promises;
    
    try {
      await fs.access(this.config.storage.path!);
    } catch {
      await fs.mkdir(this.config.storage.path!, { recursive: true });
    }
  }

  private buildBackupCommand(filepath: string): string {
    const dbUrl = process.env['DATABASE_URL']!;
    const url = new URL(dbUrl);
    
    let command = `pg_dump`;
    command += ` -h ${url.hostname}`;
    command += ` -p ${url.port || 5432}`;
    command += ` -U ${url.username}`;
    command += ` -d ${url.pathname.slice(1)}`;
    command += ` -f ${filepath}`;
    
    if (this.config.compression) {
      command += ` --compress=9`;
    }
    
    command += ` --verbose`;
    
    return command;
  }

  private buildRestoreCommand(filepath: string): string {
    const dbUrl = process.env['DATABASE_URL']!;
    const url = new URL(dbUrl);
    
    let command = `psql`;
    command += ` -h ${url.hostname}`;
    command += ` -p ${url.port || 5432}`;
    command += ` -U ${url.username}`;
    command += ` -d ${url.pathname.slice(1)}`;
    command += ` -f ${filepath}`;
    
    return command;
  }

  private async compressBackup(filepath: string): Promise<void> {
    const { exec } = require('child_process');
    const { promisify } = require('util');
    const execAsync = promisify(exec);
    
    await execAsync(`gzip ${filepath}`);
  }

  private async encryptBackup(filepath: string): Promise<void> {
    const { exec } = require('child_process');
    const { promisify } = require('util');
    const execAsync = promisify(exec);
    
    const password = process.env['BACKUP_ENCRYPTION_PASSWORD'];
    if (!password) {
      throw new Error('BACKUP_ENCRYPTION_PASSWORD environment variable is required for encryption');
    }
    
    await execAsync(`openssl enc -aes-256-cbc -salt -in ${filepath} -out ${filepath}.enc -pass pass:${password}`);
    await execAsync(`rm ${filepath}`);
  }

  private async uploadToS3(filepath: string, filename: string): Promise<void> {
    // This would require AWS SDK implementation
    // For now, just log that it would happen
    logInfo('Would upload to S3', { filepath, filename, bucket: this.config.storage.bucket });
  }

  private async getFileSize(filepath: string): Promise<number> {
    const fs = require('fs').promises;
    const stats = await fs.stat(filepath);
    return stats.size;
  }

  private async listBackups(): Promise<Array<{ path: string; date: Date; type: string }>> {
    // Implementation would depend on storage type
    // For now, return empty array
    return [];
  }

  private async deleteBackup(filepath: string): Promise<void> {
    const fs = require('fs').promises;
    await fs.unlink(filepath);
  }

  private async decryptBackup(filepath: string): Promise<void> {
    const { exec } = require('child_process');
    const { promisify } = require('util');
    const execAsync = promisify(exec);
    
    const password = process.env['BACKUP_ENCRYPTION_PASSWORD'];
    if (!password) {
      throw new Error('BACKUP_ENCRYPTION_PASSWORD environment variable is required for decryption');
    }
    
    await execAsync(`openssl enc -aes-256-cbc -d -in ${filepath}.enc -out ${filepath} -pass pass:${password}`);
  }

  private async decompressBackup(filepath: string): Promise<void> {
    const { exec } = require('child_process');
    const { promisify } = require('util');
    const execAsync = promisify(exec);
    
    await execAsync(`gunzip ${filepath}.gz`);
  }
}

export const databaseBackup = new DatabaseBackup(); 