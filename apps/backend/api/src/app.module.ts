import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './user/users.module';
import { DocumentsModule } from './documents/documents.module';
import { ExpensesModule } from './expenses/expenses.module';
import { BudgetsModule } from './budgets/budgets.module';
import { AccountModule } from './account/account.module';
import { ApplicationsModule } from './applications/applications.module';

@Module({
  imports: [
    AuthModule,
    UsersModule,
    DocumentsModule,
    ExpensesModule,
    BudgetsModule,
    AccountModule,
    ApplicationsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
