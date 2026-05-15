package ai.nanoclawd.app.ui

import androidx.compose.runtime.Composable
import ai.nanoclawd.app.MainViewModel
import ai.nanoclawd.app.ui.chat.ChatSheetContent

@Composable
fun ChatSheet(viewModel: MainViewModel) {
  ChatSheetContent(viewModel = viewModel)
}
