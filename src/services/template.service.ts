import hbs from 'handlebars';
import fs from 'fs/promises';
import path from 'path';
import { logger } from '../config/logger';

class TemplateService {
    private templatesDir = path.join(__dirname, '../common/templates/email-templates');
    private compiledTemplates: Record<string, hbs.TemplateDelegate> = {};
    private layout: hbs.TemplateDelegate | null = null;

    async init() {
        try {
            const layoutPath = path.join(this.templatesDir, 'layout.hbs');
            const layoutSource = await fs.readFile(layoutPath, 'utf-8');
            this.layout = hbs.compile(layoutSource);
            logger.info('Email layout template loaded and compiled');
        } catch (error) {
            logger.error('Failed to load email layout template', error);
            throw error;
        }
    }

    async render(templateName: string, data: Record<string, unknown>): Promise<string> {
        if (!this.layout) {
            await this.init();
        }

        try {
            let compiledTemplate = this.compiledTemplates[templateName];
            
            if (!compiledTemplate) {
                const templatePath = path.join(this.templatesDir, `${templateName}.hbs`);
                const source = await fs.readFile(templatePath, 'utf-8');
                compiledTemplate = hbs.compile(source);
                this.compiledTemplates[templateName] = compiledTemplate;
            }

            const body = compiledTemplate(data);
            return this.layout!({
                ...data,
                body,
                currentYear: new Date().getFullYear(),
                clientUrl: process.env.CLIENT_URL || 'http://localhost:5173'
            });
        } catch (error) {
            logger.error(`Failed to render email template: ${templateName}`, error);
            throw error;
        }
    }
}

export const templateService = new TemplateService();
