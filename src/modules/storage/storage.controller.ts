import { Body, Controller, Get, Options, Post, Query, Req, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { JwtAuthGuard, Public } from '../auth/guards/jwt-auth.guard';
import { CreatePresignDto } from './dto/create-presign.dto';
import { StorageService } from './storage.service';

@ApiTags('Storage')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('storage')
export class StorageController {
  constructor(private readonly storage: StorageService) {}

  @Post('presign')
  @ApiOperation({ summary: 'Genera URL firmada para subir a S3 (PUT)' })
  async presign(@Body() dto: CreatePresignDto, @Req() req: any) {
    return this.storage.presignPut(dto, req.user?.id, req.user?.role);
  }

  @Post('presign/avatar')
  @ApiOperation({ summary: 'Genera URL firmada para subir avatar del usuario (solo imágenes)' })
  async presignAvatar(@Body() dto: Partial<CreatePresignDto>, @Req() req: any) {
    const folder = `users/${req.user?.id}/avatar`;
    const body = {
      folder,
      contentType: dto.contentType || 'image/jpeg',
      filename: dto.filename,
    } as CreatePresignDto;
    return this.storage.presignPut(body, req.user?.id, req.user?.role);
  }

  @Options('proxy')
  @Public()
  async proxyOptions(@Res() res: Response) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');
    res.status(200).end();
  }

  @Get('proxy')
  @Public()
  @ApiOperation({ summary: 'Proxy para servir archivos de S3 (evita problemas de CORS)' })
  async proxy(@Query('url') url: string, @Res() res: Response) {
    if (!url) {
      res.status(400).json({ message: 'URL es requerida' });
      return;
    }

    try {
      const s3Key = this.storage.extractS3KeyFromUrl(url);
      
      if (!s3Key) {
        res.status(400).json({ message: 'URL no válida para este bucket' });
        return;
      }

      const { body, contentType } = await this.storage.getObject(s3Key);
      
      res.setHeader('Content-Type', contentType);
      res.setHeader('Cache-Control', 'public, max-age=31536000');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
      
      const MAX_SIZE_MB = process.env.MAX_IMAGE_SIZE_MB ? parseInt(process.env.MAX_IMAGE_SIZE_MB) : 100;
      const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;
      
      if (body && typeof body.pipe === 'function') {
        return new Promise<void>((resolve, reject) => {
          let totalSize = 0;
          let finished = false;
          
          const cleanup = () => {
            if (!finished) {
              finished = true;
            }
          };
          
          body.on('data', (chunk: Buffer) => {
            totalSize += chunk.length;
            if (totalSize > MAX_SIZE_BYTES) {
              body.destroy();
              if (!res.headersSent) {
                res.status(413).json({ 
                  message: `Archivo demasiado grande. Tamaño máximo: ${MAX_SIZE_MB}MB. Tamaño actual: ${(totalSize / 1024 / 1024).toFixed(2)}MB` 
                });
              }
              cleanup();
              reject(new Error('Archivo demasiado grande'));
            }
          });
          
          body.on('error', (err: any) => {
            cleanup();
            if (!res.headersSent) {
              res.status(500).json({ message: 'Error al leer stream de S3' });
            } else {
              res.end();
            }
            reject(err);
          });
          
          res.on('error', (err: any) => {
            cleanup();
            reject(err);
          });
          
          res.on('finish', () => {
            cleanup();
            resolve();
          });
          
          res.on('close', () => {
            cleanup();
            resolve();
          });
          
          (body as any).pipe(res);
        });
      } else {
        const chunks: Buffer[] = [];
        let totalSize = 0;
        
        try {
          for await (const chunk of body as any) {
            const buffer = Buffer.from(chunk);
            totalSize += buffer.length;
            
            if (totalSize > MAX_SIZE_BYTES) {
              res.status(413).json({ 
                message: `Archivo demasiado grande. Tamaño máximo: ${MAX_SIZE_MB}MB. Tamaño actual: ${(totalSize / 1024 / 1024).toFixed(2)}MB` 
              });
              return;
            }
            
            chunks.push(buffer);
          }
          
          const finalBuffer = Buffer.concat(chunks);
          res.send(finalBuffer);
        } catch (streamError: any) {
          if (!res.headersSent) {
            res.status(500).json({ message: 'Error al leer stream de S3: ' + streamError.message });
          }
          throw streamError;
        }
      }
    } catch (error: any) {
      if (error.status === 404) {
        res.status(404).json({ message: 'Archivo no encontrado' });
        return;
      }
      res.status(500).json({ message: error.message || 'Error al obtener archivo' });
    }
  }
}
