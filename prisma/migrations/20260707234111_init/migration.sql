-- CreateTable
CREATE TABLE "tenants" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "plan" TEXT NOT NULL DEFAULT 'trial',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "role" TEXT NOT NULL DEFAULT 'operator',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shops" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "name" TEXT,
    "apiKey" TEXT,
    "apiSecret" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shops_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "source_products" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "sourceProductId" TEXT NOT NULL,
    "sourceUrl" TEXT,
    "titleCn" TEXT NOT NULL,
    "shopName" TEXT,
    "categorySource" TEXT,
    "priceMinCny" DECIMAL(10,2),
    "priceMaxCny" DECIMAL(10,2),
    "salesCount" INTEGER,
    "minOrderQuantity" INTEGER,
    "mainImage" TEXT,
    "imageUrls" JSONB,
    "skuSummary" JSONB,
    "rawScore" DECIMAL(4,3),
    "rawPayload" JSONB,
    "normalizedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "source_products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_drafts" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "sourceProductId" TEXT,
    "source" TEXT NOT NULL DEFAULT '1688',
    "titleCn" TEXT NOT NULL,
    "titleVi" TEXT,
    "titleTh" TEXT,
    "categorySource" TEXT,
    "categoryShopee" TEXT,
    "attributes" JSONB,
    "skus" JSONB,
    "sourceImages" JSONB,
    "generatedImages" JSONB,
    "descriptionVi" TEXT,
    "pricing" JSONB,
    "inventory" JSONB,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_drafts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "listing_tasks" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "agentId" TEXT,
    "conversationId" TEXT,
    "userId" TEXT,
    "shopId" TEXT,
    "productDraftIds" TEXT[],
    "steps" JSONB,
    "costEstimateCny" DECIMAL(10,2),
    "costActualCny" DECIMAL(10,2),
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "listing_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tool_call_logs" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "taskId" TEXT,
    "tool" TEXT NOT NULL,
    "requestSummary" JSONB,
    "responseSummary" JSONB,
    "status" TEXT NOT NULL,
    "latencyMs" INTEGER,
    "costCny" DECIMAL(10,4),
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tool_call_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_tenantId_idx" ON "users"("tenantId");

-- CreateIndex
CREATE INDEX "shops_tenantId_platform_idx" ON "shops"("tenantId", "platform");

-- CreateIndex
CREATE UNIQUE INDEX "shops_platform_shopId_key" ON "shops"("platform", "shopId");

-- CreateIndex
CREATE INDEX "source_products_tenantId_provider_createdAt_idx" ON "source_products"("tenantId", "provider", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "source_products_sourceProductId_idx" ON "source_products"("sourceProductId");

-- CreateIndex
CREATE INDEX "product_drafts_tenantId_status_idx" ON "product_drafts"("tenantId", "status");

-- CreateIndex
CREATE INDEX "product_drafts_sourceProductId_idx" ON "product_drafts"("sourceProductId");

-- CreateIndex
CREATE INDEX "listing_tasks_tenantId_status_createdAt_idx" ON "listing_tasks"("tenantId", "status", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "tool_call_logs_tenantId_tool_createdAt_idx" ON "tool_call_logs"("tenantId", "tool", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "tool_call_logs_taskId_idx" ON "tool_call_logs"("taskId");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shops" ADD CONSTRAINT "shops_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "source_products" ADD CONSTRAINT "source_products_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_drafts" ADD CONSTRAINT "product_drafts_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_drafts" ADD CONSTRAINT "product_drafts_sourceProductId_fkey" FOREIGN KEY ("sourceProductId") REFERENCES "source_products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "listing_tasks" ADD CONSTRAINT "listing_tasks_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tool_call_logs" ADD CONSTRAINT "tool_call_logs_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tool_call_logs" ADD CONSTRAINT "tool_call_logs_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "listing_tasks"("id") ON DELETE SET NULL ON UPDATE CASCADE;
