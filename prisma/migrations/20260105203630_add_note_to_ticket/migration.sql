BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[users] (
    [id] UNIQUEIDENTIFIER NOT NULL,
    [username] NVARCHAR(255),
    [email] NVARCHAR(255) NOT NULL,
    [phone] NVARCHAR(500),
    [password] NVARCHAR(255),
    [firstName] NVARCHAR(500) NOT NULL,
    [lastName] NVARCHAR(500) NOT NULL,
    [role] VARCHAR(20) NOT NULL CONSTRAINT [users_role_df] DEFAULT 'customer',
    [isActive] BIT NOT NULL CONSTRAINT [users_isActive_df] DEFAULT 1,
    [employeeId] NVARCHAR(100),
    [counterNumber] NVARCHAR(50),
    [microsoftId] NVARCHAR(255),
    [language] NVARCHAR(10) CONSTRAINT [users_language_df] DEFAULT 'en',
    [theme] NVARCHAR(20) CONSTRAINT [users_theme_df] DEFAULT 'light',
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [users_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [users_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [users_username_key] UNIQUE NONCLUSTERED ([username]),
    CONSTRAINT [users_email_key] UNIQUE NONCLUSTERED ([email])
);

-- CreateTable
CREATE TABLE [dbo].[categories] (
    [id] UNIQUEIDENTIFIER NOT NULL,
    [name] NVARCHAR(100) NOT NULL,
    [description] NVARCHAR(500),
    [isActive] BIT NOT NULL CONSTRAINT [categories_isActive_df] DEFAULT 1,
    [estimatedWaitTime] INT NOT NULL CONSTRAINT [categories_estimatedWaitTime_df] DEFAULT 0,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [categories_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [categories_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [categories_name_key] UNIQUE NONCLUSTERED ([name])
);

-- CreateTable
CREATE TABLE [dbo].[agent_categories] (
    [id] UNIQUEIDENTIFIER NOT NULL,
    [agentId] UNIQUEIDENTIFIER NOT NULL,
    [categoryId] UNIQUEIDENTIFIER NOT NULL,
    [isActive] BIT NOT NULL CONSTRAINT [agent_categories_isActive_df] DEFAULT 1,
    [assignedAt] DATETIME2 NOT NULL CONSTRAINT [agent_categories_assignedAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [agent_categories_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[tickets] (
    [id] UNIQUEIDENTIFIER NOT NULL,
    [tokenNumber] NVARCHAR(50) NOT NULL,
    [categoryId] UNIQUEIDENTIFIER NOT NULL,
    [agentId] UNIQUEIDENTIFIER,
    [status] VARCHAR(20) NOT NULL CONSTRAINT [tickets_status_df] DEFAULT 'pending',
    [customerName] NVARCHAR(500),
    [customerPhone] NVARCHAR(500),
    [customerEmail] NVARCHAR(500),
    [formData] NVARCHAR(max),
    [note] NVARCHAR(max),
    [calledAt] DATETIME2,
    [servingStartedAt] DATETIME2,
    [completedAt] DATETIME2,
    [noShowAt] DATETIME2,
    [positionInQueue] INT NOT NULL CONSTRAINT [tickets_positionInQueue_df] DEFAULT 0,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [tickets_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [tickets_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [tickets_tokenNumber_key] UNIQUE NONCLUSTERED ([tokenNumber])
);

-- CreateTable
CREATE TABLE [dbo].[notification_settings] (
    [id] UNIQUEIDENTIFIER NOT NULL,
    [method] VARCHAR(20) NOT NULL CONSTRAINT [notification_settings_method_df] DEFAULT 'sms',
    [smtpHost] NVARCHAR(500),
    [smtpPort] INT,
    [smtpUser] NVARCHAR(500),
    [smtpPassEncrypted] NVARCHAR(max),
    [smtpFromEmail] NVARCHAR(255),
    [smtpFromName] NVARCHAR(255),
    [twilioAccountSidEnc] NVARCHAR(max),
    [twilioAuthTokenEnc] NVARCHAR(max),
    [twilioFromNumber] NVARCHAR(50),
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [notification_settings_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [notification_settings_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [users_microsoftId_idx] ON [dbo].[users]([microsoftId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [tickets_agentId_status_createdAt_idx] ON [dbo].[tickets]([agentId], [status], [createdAt]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [tickets_categoryId_status_createdAt_idx] ON [dbo].[tickets]([categoryId], [status], [createdAt]);

-- AddForeignKey
ALTER TABLE [dbo].[agent_categories] ADD CONSTRAINT [agent_categories_agentId_fkey] FOREIGN KEY ([agentId]) REFERENCES [dbo].[users]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[agent_categories] ADD CONSTRAINT [agent_categories_categoryId_fkey] FOREIGN KEY ([categoryId]) REFERENCES [dbo].[categories]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[tickets] ADD CONSTRAINT [tickets_categoryId_fkey] FOREIGN KEY ([categoryId]) REFERENCES [dbo].[categories]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[tickets] ADD CONSTRAINT [tickets_agentId_fkey] FOREIGN KEY ([agentId]) REFERENCES [dbo].[users]([id]) ON DELETE SET NULL ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
