'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { getElection } from '@/lib/api/elections';
import { apiClient } from '@/lib/api/client';
import { Election } from '@/types/election';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { getErrorMessage } from '@/lib/api/client';
import { formatDateTime } from '@/lib/utils/election';
import {
  ArrowLeft,
  Upload,
  Download,
  Trash2,
  FileText,
  Loader2,
} from 'lucide-react';

interface TransitionDocument {
  id: string;
  title: string;
  description: string;
  category: string;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  uploadedBy: {
    id: string;
    name: string;
    email: string;
  };
  createdAt: string;
}

const documentSchema = z.object({
  title: z.string().min(1, '제목을 입력하세요.'),
  description: z.string().optional(),
  category: z.string().min(1, '카테고리를 선택하세요.'),
});

type DocumentFormData = z.infer<typeof documentSchema>;

const documentCategories = [
  { value: 'FINANCIAL', label: '재무 자료' },
  { value: 'ADMINISTRATIVE', label: '행정 자료' },
  { value: 'MEMBER', label: '회원 관리' },
  { value: 'EVENT', label: '행사 기록' },
  { value: 'OTHER', label: '기타' },
];

export default function AdminTransitionPage() {
  const params = useParams();
  const router = useRouter();
  const electionId = params.id as string;

  const [election, setElection] = useState<Election | null>(null);
  const [documents, setDocuments] = useState<TransitionDocument[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const form = useForm<DocumentFormData>({
    resolver: zodResolver(documentSchema),
    defaultValues: {
      category: 'FINANCIAL',
    },
  });

  useEffect(() => {
    loadData();
  }, [electionId]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [electionData, documentsData] = await Promise.all([
        getElection(electionId),
        apiClient.get<TransitionDocument[]>(`/elections/${electionId}/transition-docs`),
      ]);
      setElection(electionData);
      setDocuments(documentsData.data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data: DocumentFormData) => {
    if (!selectedFile) {
      alert('파일을 선택하세요.');
      return;
    }

    try {
      setIsUploading(true);
      setError(null);

      // FormData로 파일 업로드
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('title', data.title);
      formData.append('description', data.description || '');
      formData.append('category', data.category);

      await apiClient.post(
        `/elections/${electionId}/transition-docs`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      setSuccess(true);
      form.reset({
        title: '',
        description: '',
        category: 'FINANCIAL',
      });
      setSelectedFile(null);
      setTimeout(() => setSuccess(false), 3000);
      await loadData();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleDownload = async (doc: TransitionDocument) => {
    try {
      const response = await apiClient.get(
        `/elections/${electionId}/transition-docs/${doc.id}/download`,
        {
          responseType: 'blob',
        }
      );

      // Blob을 다운로드
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', doc.fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const handleDelete = async (docId: string) => {
    if (!confirm('정말 이 문서를 삭제하시겠습니까?')) {
      return;
    }

    try {
      setError(null);
      await apiClient.delete(`/elections/${electionId}/transition-docs/${docId}`);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      await loadData();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-3/4" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!election) {
    return (
      <Alert variant="destructive">
        <AlertDescription>선거를 찾을 수 없습니다.</AlertDescription>
      </Alert>
    );
  }

  // 카테고리별로 문서 그룹화
  const documentsByCategory = documentCategories.map((cat) => ({
    category: cat,
    documents: documents.filter((doc) => doc.category === cat.value),
  }));

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div>
        <Button
          variant="outline"
          onClick={() => router.push(`/admin/elections/${electionId}`)}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          선거 상세로 돌아가기
        </Button>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold">{election.name}</h1>
            <p className="text-gray-600 mt-1">이양 문서 관리</p>
          </div>
          <FileText className="h-8 w-8 text-blue-500" />
        </div>
      </div>

      {success && (
        <Alert>
          <AlertDescription>작업이 완료되었습니다.</AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* 문서 업로드 폼 */}
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle>문서 업로드</CardTitle>
            <CardDescription>
              이양 문서를 업로드합니다. (예: 회계 자료, 회원 명단, 행사 기록 등)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 제목 */}
            <div className="space-y-2">
              <Label htmlFor="title">문서 제목 *</Label>
              <Input
                id="title"
                {...form.register('title')}
                placeholder="예: 2024년 회계 보고서"
                disabled={isUploading}
              />
              {form.formState.errors.title && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.title.message}
                </p>
              )}
            </div>

            {/* 카테고리 */}
            <div className="space-y-2">
              <Label htmlFor="category">카테고리 *</Label>
              <select
                id="category"
                {...form.register('category')}
                className="w-full px-3 py-2 border rounded-md"
                disabled={isUploading}
              >
                {documentCategories.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
              {form.formState.errors.category && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.category.message}
                </p>
              )}
            </div>

            {/* 설명 */}
            <div className="space-y-2">
              <Label htmlFor="description">설명</Label>
              <textarea
                id="description"
                {...form.register('description')}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                rows={3}
                placeholder="문서에 대한 간단한 설명"
                disabled={isUploading}
              />
            </div>

            {/* 파일 선택 */}
            <div className="space-y-2">
              <Label htmlFor="file">파일 *</Label>
              <Input
                id="file"
                type="file"
                onChange={handleFileChange}
                disabled={isUploading}
              />
              {selectedFile && (
                <p className="text-sm text-gray-600">
                  선택된 파일: {selectedFile.name} (
                  {formatFileSize(selectedFile.size)})
                </p>
              )}
            </div>

            <Button type="submit" disabled={isUploading || !selectedFile}>
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  업로드 중...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  문서 업로드
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </form>

      {/* 문서 목록 */}
      <Card>
        <CardHeader>
          <CardTitle>업로드된 문서 ({documents.length})</CardTitle>
          <CardDescription>카테고리별로 정리된 이양 문서 목록입니다.</CardDescription>
        </CardHeader>
        <CardContent>
          {documents.length === 0 ? (
            <p className="text-center text-gray-500 py-8">
              아직 업로드된 문서가 없습니다.
            </p>
          ) : (
            <div className="space-y-6">
              {documentsByCategory.map(({ category, documents: catDocs }) => {
                if (catDocs.length === 0) return null;

                return (
                  <div key={category.value}>
                    <h3 className="text-lg font-semibold mb-3">{category.label}</h3>
                    <div className="space-y-2">
                      {catDocs.map((doc) => (
                        <div
                          key={doc.id}
                          className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <FileText className="h-5 w-5 text-blue-500" />
                              <div>
                                <h4 className="font-medium">{doc.title}</h4>
                                {doc.description && (
                                  <p className="text-sm text-gray-600">
                                    {doc.description}
                                  </p>
                                )}
                                <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
                                  <span>{doc.fileName}</span>
                                  <span>{formatFileSize(doc.fileSize)}</span>
                                  <span>
                                    업로드: {formatDateTime(doc.createdAt)}
                                  </span>
                                  <span>by {doc.uploadedBy.name}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDownload(doc)}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(doc.id)}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 안내 사항 */}
      <Alert>
        <AlertDescription>
          <strong>이양 문서 관리 안내:</strong>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>임원 임기 종료 시 다음 임원에게 인수인계할 자료를 업로드합니다.</li>
            <li>재무 자료, 회원 명단, 행사 기록 등을 체계적으로 관리합니다.</li>
            <li>문서는 관리자만 열람 및 다운로드할 수 있습니다.</li>
          </ul>
        </AlertDescription>
      </Alert>
    </div>
  );
}
